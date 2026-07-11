import { useEffect } from "react";
import { setUserOffline } from "@/lib/userService";

export function usePresence(user) {
  useEffect(() => {
    if (!user) return;

    const handleBeforeUnload = () => {
      navigator.sendBeacon?.(
        `${window.location.origin}/_presence/offline`,
        JSON.stringify({ uid: user.uid }),
      );
      setUserOffline(user.uid);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      setUserOffline(user.uid);
    };
  }, [user]);
}
