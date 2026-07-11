import {
  collection, doc, addDoc, getDoc, getDocs, setDoc,
  updateDoc, query, where, orderBy, limit,
  onSnapshot, serverTimestamp,
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
    orderBy("updatedAt", "desc"),
  );
  return onSnapshot(q, 
    (snap) => {
      const list = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((c) => !c.isDeleted);
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
    lastMessage: { content, senderId, timestamp: serverTimestamp(), type },
    updatedAt: serverTimestamp(),
  });

  return msgRef.id;
}

export function listenToMessages(conversationId, callback) {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    orderBy("timestamp", "asc"),
  );
  return onSnapshot(q, (snap) => {
    const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
