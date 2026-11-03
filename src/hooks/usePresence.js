import { useEffect } from "react";
import { setUserOnline, setUserOffline } from "@/lib/userService";

const HEARTBEAT_MS = 45 * 1000;

function presenceVisible() {
  try {
    return localStorage.getItem("csc_presence_visible") !== "false";
  } catch {
    return true;
  }
}

/**
 * WhatsApp-style presence:
 * - online while the tab is visible and the device has internet
 * - heartbeat keeps `lastSeen` fresh so crashed tabs expire
 * - offline on hide/pagehide and when the network drops
 */
export function usePresence(user) {
  useEffect(() => {
    if (!user?.uid) return;

    let heartbeat = null;
    let disposed = false;

    const publishOnline = () => {
      if (disposed) return;
      if (!navigator.onLine || !presenceVisible()) {
        setUserOffline(user.uid);
        return;
      }
      setUserOnline(user.uid);
    };

    const publishOffline = () => {
      if (disposed) return;
      setUserOffline(user.uid);
    };

    const stopHeartbeat = () => {
      if (heartbeat) {
        clearInterval(heartbeat);
        heartbeat = null;
      }
    };

    const startHeartbeat = () => {
      stopHeartbeat();
      if (!navigator.onLine || !presenceVisible()) return;
      heartbeat = setInterval(publishOnline, HEARTBEAT_MS);
    };

    const goOnline = () => {
      publishOnline();
      startHeartbeat();
    };

    const goOffline = () => {
      stopHeartbeat();
      publishOffline();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") goOnline();
      else goOffline();
    };

    const onPresenceSetting = () => {
      if (presenceVisible()) goOnline();
      else goOffline();
    };

    if (document.visibilityState === "visible") goOnline();
    else goOffline();

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    window.addEventListener("pagehide", goOffline);
    window.addEventListener("focus", goOnline);
    window.addEventListener("csc-presence-changed", onPresenceSetting);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      disposed = true;
      stopHeartbeat();
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("pagehide", goOffline);
      window.removeEventListener("focus", goOnline);
      window.removeEventListener("csc-presence-changed", onPresenceSetting);
      document.removeEventListener("visibilitychange", onVisibility);
      setUserOffline(user.uid);
    };
  }, [user]);
}
