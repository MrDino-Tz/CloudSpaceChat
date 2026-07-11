import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAlU_SLksvywIEBsxOg2ibQxaey991Syv8",
  authDomain: "cloudchatspace.firebaseapp.com",
  projectId: "cloudchatspace",
  storageBucket: "cloudchatspace.firebasestorage.app",
  messagingSenderId: "813119134323",
  appId: "1:813119134323:web:dad84b7b32bf73f8c0e806",
  measurementId: "G-LSEK2Y4GRJ",
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, analytics, auth, db, storage };
