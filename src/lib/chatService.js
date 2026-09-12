import {
  collection, doc, addDoc, getDoc, getDocs, setDoc,
  updateDoc, query, where, orderBy, limit, increment,
  onSnapshot, serverTimestamp, arrayUnion, writeBatch, deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Conversations ──────────────────────────────────────────────────────────

const dedupeHealInFlight = {};

/** Deterministic ID for a private chat — both users always resolve to the same doc. */
function getPrivateConversationId(userId1, userId2) {
  return `dm_${[userId1, userId2].sort().join("_")}`;
}

async function getMessagesByConversation(conversationId) {
  const snap = await getDocs(
    query(collection(db, "messages"), where("conversationId", "==", conversationId)),
  );
  return snap.docs;
}

async function mergeConversationMessages(fromId, intoId) {
  const msgs = await getMessagesByConversation(fromId);
  let batch = writeBatch(db);
  let count = 0;
  for (const m of msgs) {
    batch.update(m.ref, { conversationId: intoId });
    count++;
    if (count >= 400) {
      await batch.commit();
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) await batch.commit();
}

export async function createPrivateConversation(userId1, userId2) {
  // 1) Deterministic doc ID first — kills the creation race between the two clients.
  const convId = getPrivateConversationId(userId1, userId2);
  const snap = await getDoc(doc(db, "conversations", convId));
  if (snap.exists() && !snap.data().isDeleted) return convId;

  // 2) Reuse / heal any pre-existing legacy conversation.
  const existing = await deduplicatePrivateConversations(userId1, userId2);
  if (existing) return existing;

  // 3) Idempotent create — both clients target the exact same document.
  await setDoc(doc(db, "conversations", convId), {
    type: "private",
    participants: [userId1, userId2],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    mutedBy: [],
    archivedBy: [],
    pinnedBy: [],
    unreadCount: {},
    typing: {},
  });
  return convId;
}

export async function createGroupConversation(data) {
  const ref = await addDoc(collection(db, "conversations"), {
    type: "group",
    participants: data.participants,
    name: data.name || "Group",
    avatar: data.avatar || "",
    description: data.description || "",
    createdBy: data.createdBy,
    admins: [data.createdBy],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastMessage: null,
    mutedBy: [],
    archivedBy: [],
    pinnedBy: [],
    unreadCount: {},
    typing: {},
  });
  return ref.id;
}

export function listenToConversations(userId, callback, onError) {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId),
  );
  let healTimer = null;
  return onSnapshot(q, 
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => !c.isDeleted);
      list.sort((a, b) => {
        const ta = a.updatedAt?.toDate?.() || new Date(0);
        const tb = b.updatedAt?.toDate?.() || new Date(0);
        return tb - ta;
      });
      callback(list);

      // Lazily heal existing duplicate private conversations (fire-and-forget, once per burst).
      if (healTimer) return;
      healTimer = setTimeout(() => {
        healTimer = null;
        const pairs = new Map();
        for (const c of list) {
          if (c.type !== "private" || c.participants?.length !== 2) continue;
          const key = c.participants.slice().sort().join("_");
          if (!pairs.has(key)) pairs.set(key, []);
          pairs.get(key).push(c);
        }
        for (const [_key, convs] of pairs) {
          if (convs.length > 1 && !dedupeHealInFlight[_key]) {
            dedupeHealInFlight[_key] = true;
            deduplicatePrivateConversations(convs[0].participants[0], convs[0].participants[1])
              .catch(() => {})
              .finally(() => { delete dedupeHealInFlight[_key]; });
          }
        }
      }, 800);
    },
    (error) => {
      console.warn("listenToConversations error:", error);
      onError?.(error);
    },
  );
}

export async function getConversation(id) {
  const snap = await getDoc(doc(db, "conversations", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ─── Messages ───────────────────────────────────────────────────────────────

export async function sendMessage(conversationId, senderId, { content, type = "text", replyTo = null, attachments = [] }) {
  const msgRef = await addDoc(collection(db, "messages"), {
    conversationId,
    senderId,
    content,
    type,
    timestamp: serverTimestamp(),
    readBy: [senderId],
    deliveredTo: [senderId],
    replyTo,
    attachments,
    reactions: {},
    edited: null,
    isDeleted: false,
    deletedFor: [],
  });

  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: { content, senderId, timestamp: serverTimestamp(), type, attachments },
    updatedAt: serverTimestamp(),
  });

  return msgRef.id;
}

export function listenToMessages(conversationId, callback) {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      const ta = a.timestamp?.toDate?.() || new Date(0);
      const tb = b.timestamp?.toDate?.() || new Date(0);
      return ta - tb;
    });
    callback(list);
  });
}

export async function updateMessage(messageId, data) {
  await updateDoc(doc(db, "messages", messageId), data);
}

export async function deleteMessage(messageId, userId) {
  await updateDoc(doc(db, "messages", messageId), {
    isDeleted: true,
    deletedFor: [userId],
  });
}

export async function deduplicatePrivateConversations(userId1, userId2, { merge = true } = {}) {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId1),
  );
  const snap = await getDocs(q);
  const dups = snap.docs
    .filter((d) => !d.data().isDeleted && d.data().type === "private" && d.data().participants.includes(userId2))
    .sort((a, b) => (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0));

  if (dups.length <= 1) return dups[0]?.id || null;

  const keep = dups[0];
  for (const d of dups.slice(1)) {
    if (merge) {
      await mergeConversationMessages(d.id, keep.id);
      // Take the most recent updatedAt / lastMessage so the survivor stays on top.
      const keepData = keep.data();
      const loserData = d.data();
      const updates = {};
      if ((loserData.updatedAt?.toMillis?.() || 0) > (keepData.updatedAt?.toMillis?.() || 0)) {
        updates.updatedAt = loserData.updatedAt;
      }
      if ((loserData.lastMessage?.timestamp?.toMillis?.() || 0) > (keepData.lastMessage?.timestamp?.toMillis?.() || 0)) {
        updates.lastMessage = loserData.lastMessage;
      }
      if (Object.keys(updates).length) await updateDoc(doc(db, "conversations", keep.id), updates);
    }
    await updateDoc(doc(db, "conversations", d.id), { isDeleted: true });
  }
  return keep.id;
}

/** Delete only for the current user (soft hide) */
export async function deleteMessageForMe(messageId, userId) {
  const ref = doc(db, "messages", messageId);
  const snap = await getDoc(ref);
  const current = snap.data()?.deletedFor || [];
  if (!current.includes(userId)) {
    await updateDoc(ref, { deletedFor: [...current, userId] });
  }
}

/** Delete for everyone (hard delete flag) */
export async function deleteMessageForEveryone(messageId) {
  await updateDoc(doc(db, "messages", messageId), {
    isDeleted: true,
    content: "This message was deleted",
  });
}

/** Edit message text */
export async function editMessage(messageId, newContent) {
  await updateDoc(doc(db, "messages", messageId), {
    content: newContent,
    edited: new Date(),
  });
}

// ─── Group Management ────────────────────────────────────────────────────────

export async function addMemberToGroup(conversationId, newUserId) {
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);
  const participants = snap.data()?.participants || [];
  if (participants.includes(newUserId)) return;
  await updateDoc(ref, {
    participants: [...participants, newUserId],
    updatedAt: serverTimestamp(),
  });
}

export async function removeMemberFromGroup(conversationId, userId) {
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);
  const data = snap.data();
  const participants = (data?.participants || []).filter((p) => p !== userId);
  const admins = (data?.admins || []).filter((a) => a !== userId);
  const update = { participants, updatedAt: serverTimestamp() };
  if (admins.length !== (data?.admins || []).length) update.admins = admins;
  await updateDoc(ref, update);
}

export async function leaveGroup(conversationId, userId) {
  await removeMemberFromGroup(conversationId, userId);
}

export async function deleteGroup(conversationId) {
  await updateDoc(doc(db, "conversations", conversationId), {
    isDeleted: true,
    updatedAt: serverTimestamp(),
  });
}

export async function updateGroupInfo(conversationId, data) {
  const update = { updatedAt: serverTimestamp() };
  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.avatar !== undefined) update.avatar = data.avatar;
  if (data.rules !== undefined) update.rules = data.rules;
  await updateDoc(doc(db, "conversations", conversationId), update);
}

export async function updateConversationFields(conversationId, fields) {
  const update = { updatedAt: serverTimestamp() };
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) update[k] = v;
  }
  await updateDoc(doc(db, "conversations", conversationId), update);
}

export async function toggleAdmin(conversationId, targetUserId) {
  const ref = doc(db, "conversations", conversationId);
  const snap = await getDoc(ref);
  const admins = snap.data()?.admins || [];
  const isAdmin = admins.includes(targetUserId);
  await updateDoc(ref, {
    admins: isAdmin ? admins.filter((a) => a !== targetUserId) : [...admins, targetUserId],
    updatedAt: serverTimestamp(),
  });
  return !isAdmin;
}

export async function setTyping(conversationId, userId) {
  try {
    await updateDoc(doc(db, "conversations", conversationId), {
      [`typing.${userId}`]: serverTimestamp(),
    });
  } catch { /* silent */ }
}

export async function clearTyping(conversationId, userId) {
  try {
    await updateDoc(doc(db, "conversations", conversationId), {
      [`typing.${userId}`]: deleteField(),
    });
  } catch { /* silent */ }
}

export async function sendSystemMessage(conversationId, content) {
  await addDoc(collection(db, "messages"), {
    conversationId,
    senderId: "__system__",
    content,
    type: "system",
    timestamp: serverTimestamp(),
    readBy: [],
    deliveredTo: [],
    isDeleted: false,
  });
  await updateDoc(doc(db, "conversations", conversationId), {
    lastMessage: { content, senderId: "__system__", timestamp: serverTimestamp(), type: "system" },
    updatedAt: serverTimestamp(),
  });
}

/** Toggle star on a message for a user */
export async function toggleStarMessage(messageId, userId) {
  const ref = doc(db, "messages", messageId);
  const snap = await getDoc(ref);
  const current = snap.data()?.starredBy || [];
  const isStarred = current.includes(userId);
  await updateDoc(ref, {
    starredBy: isStarred ? current.filter((u) => u !== userId) : [...current, userId],
  });
  return !isStarred;
}

// ─── Unread Counts ──────────────────────────────────────────────────────────────

export async function incrementUnreadCount(conversationId, userId) {
  await updateDoc(doc(db, "conversations", conversationId), {
    [`unreadCount.${userId}`]: increment(1),
  });
}

export async function resetUnreadCount(conversationId, userId) {
  await updateDoc(doc(db, "conversations", conversationId), {
    [`unreadCount.${userId}`]: 0,
  });
}

export async function markMessagesAsReadFromList(messages, userId) {
  let batch = writeBatch(db);
  let ops = 0;
  messages.forEach((msg) => {
    batch.update(doc(db, "messages", msg.id), {
      deliveredTo: arrayUnion(userId),
      readBy: arrayUnion(userId),
    });
    ops++;
    if (ops >= 400) { batch.commit(); batch = writeBatch(db); ops = 0; }
  });
  if (ops > 0) await batch.commit();
}

