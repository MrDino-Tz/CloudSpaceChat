import { useEffect } from "react";
import { setUserOnline, setUserOffline } from "@/lib/userService";

export function usePresence(user) {
  useEffect(() => {
    if (!user) return;

    const visible = localStorage.getItem("csc_presence_visible") !== "false";

    if (visible) setUserOnline(user.uid);

    const handleBeforeUnload = () => {
      setUserOffline(user.uid);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setUserOffline(user.uid);
    };
  }, [user]);
}
