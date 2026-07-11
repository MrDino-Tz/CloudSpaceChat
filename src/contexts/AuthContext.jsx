import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile, setUserOffline } from "@/lib/userService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const p = await createUserProfile(firebaseUser);
          setProfile(p);
        } catch (err) {
          console.warn("Firestore profile creation failed (rules not set up yet?):", err);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const logout = async () => {
    if (user) await setUserOffline(user.uid);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, setProfile, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
