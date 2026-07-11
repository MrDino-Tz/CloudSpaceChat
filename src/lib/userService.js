import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function createUserProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snap = await getDoc(userRef);

  if (!snap.exists()) {
    const userData = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || user.email?.split("@")[0] || "User",
      username: user.email?.split("@")[0] || `user_${user.uid.slice(0, 6)}`,
      avatar: user.photoURL || "",
      bio: "",
      phoneNumber: user.phoneNumber || "",
      status: "",
      isOnline: true,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      contacts: [],
      blockedUsers: [],
      settings: {
        theme: "system",
        notifications: true,
        privacy: {
          lastSeen: "everyone",
          profilePhoto: "everyone",
          status: "everyone",
          readReceipts: true,
        },
        chat: {
          fontSize: 16,
          enterToSend: true,
          saveMedia: false,
        },
      },
    };
    await setDoc(userRef, userData);
    return userData;
  }

  return { ...snap.data(), id: snap.id };
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? { ...snap.data(), id: snap.id } : null;
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, "users", uid), { ...data, updatedAt: serverTimestamp() });
}

export async function setUserOnline(uid) {
  await updateDoc(doc(db, "users", uid), { isOnline: true });
}

export async function setUserOffline(uid) {
  await updateDoc(doc(db, "users", uid), { isOnline: false, lastSeen: serverTimestamp() });
}
