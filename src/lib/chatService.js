import {
  collection, doc, addDoc, getDoc, getDocs, setDoc,
  updateDoc, query, where, orderBy, limit, increment,
  onSnapshot, serverTimestamp, arrayUnion, writeBatch, deleteField,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ─── Conversations ──────────────────────────────────────────────────────────

export async function createPrivateConversation(userId1, userId2) {
  const existing = await deduplicatePrivateConversations(userId1, userId2);
  if (existing) return existing;

  const ref = await addDoc(collection(db, "conversations"), {
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
  return ref.id;
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

export async function deduplicatePrivateConversations(userId1, userId2) {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", userId1),
  );
  const snap = await getDocs(q);
  const dups = snap.docs.filter(
    (d) => d.data().type === "private" && d.data().participants.includes(userId2),
  );
  if (dups.length > 1) {
    dups.sort((a, b) => (b.data().createdAt?.toMillis?.() || 0) - (a.data().createdAt?.toMillis?.() || 0));
    const keep = dups[0];
    for (const d of dups.slice(1)) {
      await updateDoc(doc(db, "conversations", d.id), { isDeleted: true });
    }
    return keep.id;
  }
  return dups[0]?.id || null;
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

