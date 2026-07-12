import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const STORAGE_KEY = "csc_settings";

export const DEFAULTS = {
  linkScanner: "standard",       // "strict" | "standard" | "disabled"
  trustedDomains: "",            // comma-separated
  presenceVisible: true,         // show online status
  incognito: false,              // hide read receipts
  bubbleStyle: "rounded",        // "blocky" | "rounded" | "classic"
  wallpaper: "none",             // "none" | solid color hex | image URL
  fontSize: "medium",            // "small" | "medium" | "large"
  notificationsEnabled: true,
  soundOutgoing: true,
  soundIncoming: true,
  soundTyping: false,
  dndEnabled: false,
  dndStart: "22:00",
  dndEnd: "08:00",
  autoDownloadImages: true,
  autoDownloadVideo: false,
  autoDownloadAudio: false,
  theme: "dark",
};

export function getLocalSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : { ...DEFAULTS };
  } catch { return { ...DEFAULTS }; }
}

export function saveLocalSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applyTheme(themeId) {
  const THEMES = {
    light: { primary: "#F59B1D" },
    dark: { primary: "#F59B1D" },
    purple: { primary: "#8b5cf6" },
    blue: { primary: "#3b82f6" },
    green: { primary: "#22c55e" },
  };
  const t = THEMES[themeId];
  if (t) document.documentElement.style.setProperty("--primary-color", t.primary);

  if (themeId === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }
}

export function applyStyleOverrides(settings) {
  const root = document.documentElement;

  // Apply theme
  applyTheme(settings.theme || "light");

  // Bubble radius
  const radii = { blocky: "8px", rounded: "16px", classic: "16px" };
  root.style.setProperty("--bubble-radius", radii[settings.bubbleStyle] || "16px");
  root.style.setProperty("--bubble-tail", settings.bubbleStyle === "classic" ? "1" : "0");

  // Font size
  const fonts = { small: "13px", medium: "14px", large: "16px" };
  root.style.setProperty("--msg-font-size", fonts[settings.fontSize] || "14px");

  // Wallpaper
  if (settings.wallpaper && settings.wallpaper !== "none") {
    const isUrl = settings.wallpaper.startsWith("http") || settings.wallpaper.startsWith("/");
    root.style.setProperty("--chat-bg", isUrl ? `url(${settings.wallpaper})` : settings.wallpaper);
    root.style.setProperty("--chat-bg-size", isUrl ? "cover" : "auto");
  } else {
    root.style.setProperty("--chat-bg", "none");
  }
}

export async function loadSettings(userId) {
  const local = getLocalSettings();
  if (!userId) return local;
  try {
    const snap = await getDoc(doc(db, "settings", userId));
    if (snap.exists()) {
      const merged = { ...local, ...snap.data() };
      saveLocalSettings(merged);
      return merged;
    }
  } catch { /* use local */ }
  return local;
}

export async function saveSettings(userId, settings) {
  saveLocalSettings(settings);
  if (!userId) return;
  try {
    await setDoc(doc(db, "settings", userId), settings, { merge: true });
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
}
