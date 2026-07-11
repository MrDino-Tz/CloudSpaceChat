import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

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

export { app, analytics };
