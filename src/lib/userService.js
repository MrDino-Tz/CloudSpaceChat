import { collection, doc, setDoc, getDoc, getDocs, updateDoc, query, where, serverTimestamp, limit } from "firebase/firestore";
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

export async function getAllUsers(currentUid, maxResults = 50) {
  const q = query(collection(db, "users"), limit(maxResults));
  const snap = await getDocs(q);
  const results = [];
  snap.forEach((d) => {
    const data = d.data();
    if (data.uid !== currentUid) results.push({ ...data, id: d.id });
  });
  return results;
}

export async function searchUsers(searchTerm, currentUid, maxResults = 20) {
  if (!searchTerm.trim()) return [];

  const term = searchTerm.toLowerCase();
  const nameQuery = query(
    collection(db, "users"),
    where("displayName", ">=", term),
    where("displayName", "<=", term + "\uf8ff"),
    limit(maxResults),
  );

  const usernameQuery = query(
    collection(db, "users"),
    where("username", ">=", term),
    where("username", "<=", term + "\uf8ff"),
    limit(maxResults),
  );

  const [nameSnap, usernameSnap] = await Promise.allSettled([
    getDocs(nameQuery),
    getDocs(usernameQuery),
  ]);

  const seen = new Set();
  const results = [];

  const addResults = (snap) => {
    if (snap.status !== "fulfilled") return;
    snap.value.forEach((d) => {
      const data = d.data();
      if (data.uid !== currentUid && !seen.has(data.uid)) {
        seen.add(data.uid);
        results.push({ ...data, id: d.id });
      }
    });
  };

  addResults(nameSnap);
  addResults(usernameSnap);

  return results.slice(0, maxResults);
}
