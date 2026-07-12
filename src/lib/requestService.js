import {
  collection, addDoc, doc, updateDoc, getDoc, setDoc, deleteDoc,
  query, where, onSnapshot, serverTimestamp, getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendChatRequest(senderId, receiverId, senderName, senderAvatar) {
  const reqRef = await addDoc(collection(db, 'chat_requests'), {
    senderId,
    receiverId,
    senderName,
    senderAvatar: senderAvatar || '',
    status: 'pending',
    code: '',
    receiverEntered: false,
    codeVerified: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'notifications'), {
    userId: receiverId,
    type: 'chat_request',
    title: 'Chat Request',
    body: `${senderName} sent you a chat request`,
    data: { senderId, receiverId, requestId: reqRef.id, senderName, senderAvatar },
    read: false,
    createdAt: serverTimestamp(),
  });

  return reqRef.id;
}

export function listenForRequest(requestId, cb) {
  if (!requestId) return () => {};
  const unsub = onSnapshot(doc(db, 'chat_requests', requestId), (snap) => {
    if (snap.exists()) cb({ id: snap.id, ...snap.data() });
  }, (err) => {
    console.error('listenForRequest error:', err);
  });
  return unsub;
}

export function listenForNotifications(userId, cb) {
  if (!userId) return () => {};
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
  );
  const unsub = onSnapshot(q, (snap) => {
    const list = [];
    snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
    list.sort((a, b) => {
      const ta = a.createdAt?.toMillis?.() || 0;
      const tb = b.createdAt?.toMillis?.() || 0;
      return tb - ta;
    });
    cb(list);
  }, (err) => {
    console.error('listenForNotifications error:', err);
  });
  return unsub;
}

export async function acceptRequest(requestId) {
  const code = generateCode();
  const ref = doc(db, 'chat_requests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();

  await updateDoc(ref, {
    status: 'accepted',
    code,
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'notifications'), {
    userId: data.senderId,
    type: 'request_accepted',
    title: 'Request Accepted',
    body: `${data.receiverId} accepted your chat request`,
    data: { senderId: data.senderId, receiverId: data.receiverId, requestId },
    read: false,
    createdAt: serverTimestamp(),
  });

  return code;
}

export async function denyRequest(requestId) {
  const ref = doc(db, 'chat_requests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data();

  await updateDoc(ref, {
    status: 'denied',
    updatedAt: serverTimestamp(),
  });

  await addDoc(collection(db, 'notifications'), {
    userId: data.senderId,
    type: 'request_denied',
    title: 'Request Denied',
    body: `${data.receiverId} declined your chat request`,
    data: { senderId: data.senderId, receiverId: data.receiverId, requestId },
    read: false,
    createdAt: serverTimestamp(),
  });
}

export async function receiverEnterCode(requestId, enteredCode) {
  const ref = doc(db, 'chat_requests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data();
  if (data.code !== enteredCode) return false;

  await updateDoc(ref, {
    receiverEntered: true,
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function verifyCode(requestId, enteredCode) {
  const ref = doc(db, 'chat_requests', requestId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return false;
  const data = snap.data();
  if (data.code !== enteredCode) return false;

  await updateDoc(ref, {
    codeVerified: true,
    updatedAt: serverTimestamp(),
  });
  return true;
}

export async function regenerateCode(requestId) {
  const code = generateCode();
  await updateDoc(doc(db, 'chat_requests', requestId), {
    code,
    receiverEntered: false,
    codeVerified: false,
    updatedAt: serverTimestamp(),
  });
  return code;
}

export async function markNotificationRead(notificationId) {
  await updateDoc(doc(db, 'notifications', notificationId), { read: true });
}

export async function deleteNotification(notificationId) {
  await deleteDoc(doc(db, 'notifications', notificationId));
}

export async function getPendingRequests(userId) {
  const q = query(
    collection(db, 'chat_requests'),
    where('receiverId', '==', userId),
    where('status', '==', 'pending'),
  );
  const snap = await getDocs(q);
  const list = [];
  snap.forEach((d) => list.push({ id: d.id, ...d.data() }));
  return list;
}
