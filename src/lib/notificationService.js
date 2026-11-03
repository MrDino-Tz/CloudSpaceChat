// Notification helpers.
//
// Mobile Chrome (and several other mobile browsers) do not support the
// `new Notification()` constructor. Calling it throws:
//   TypeError: Illegal constructor. Use ServiceWorkerRegistration.showNotification() instead.
//
// Everything here is therefore wrapped in try/catch and prefers a service worker
// registration, falling back to the constructor only on desktop browsers that
// actually allow it. A thrown notification must never break the chat screen.

let swRegistrationPromise = null;

function baseUrl() {
  return import.meta.env.BASE_URL || "/";
}

export function registerNotificationServiceWorker() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (!("serviceWorker" in navigator)) return Promise.resolve(null);
  if (!window.isSecureContext) return Promise.resolve(null);

  if (!swRegistrationPromise) {
    swRegistrationPromise = navigator.serviceWorker
      .register(`${baseUrl()}sw.js`, { scope: baseUrl() })
      .catch((err) => {
        console.warn("Notification service worker registration failed:", err);
        return null;
      });
  }
  return swRegistrationPromise;
}

function notificationsSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission() {
  return notificationsSupported() ? Notification.permission : "unsupported";
}

export function requestNotificationPermission() {
  if (!notificationsSupported()) return Promise.resolve("unsupported");
  if (Notification.permission !== "default") {
    return Promise.resolve(Notification.permission);
  }
  try {
    return Notification.requestPermission().catch(() => Notification.permission);
  } catch {
    return Promise.resolve(Notification.permission);
  }
}

async function getRegistration() {
  if (!("serviceWorker" in navigator)) return null;
  try {
    return await registerNotificationServiceWorker();
  } catch {
    return null;
  }
}

export async function sendNotification(title, body, options = {}) {
  if (!notificationsSupported()) return;
  if (Notification.permission !== "granted") return;

  const data = {
    url: options.url || `${baseUrl()}chatroom/`,
    conversationId: options.conversationId || null,
  };
  const notificationOptions = {
    body: body || "",
    icon: `${baseUrl()}csclogo.png`,
    badge: `${baseUrl()}csclogo.png`,
    tag: options.tag || undefined,
    renotify: Boolean(options.tag),
    data,
  };

  try {
    const registration = await getRegistration();
    if (registration?.showNotification) {
      await registration.showNotification(title, notificationOptions);
      return;
    }
  } catch (err) {
    console.warn("Service worker notification failed:", err);
  }

  // Desktop fallback. Mobile browsers reject this constructor, so keep the
  // guard and swallow the error rather than crashing the app.
  try {
    new Notification(title, notificationOptions);
  } catch (err) {
    console.warn("Notification constructor unavailable:", err);
  }
}

export function isInDnd(dndEnabled, dndStart, dndEnd) {
  if (!dndEnabled) return false;
  const now = new Date();
  const current = now.getHours() * 60 + now.getMinutes();
  const start = parseTime(dndStart);
  const end = parseTime(dndEnd);
  if (start <= end) {
    return current >= start && current < end;
  }
  return current >= start || current < end;
}

function parseTime(str) {
  if (!str) return 0;
  const [h, m] = str.split(":").map(Number);
  return h * 60 + (m || 0);
}

const AudioCtx = window.AudioContext || window.webkitAudioContext;

let audioCtx = null;
try {
  audioCtx = typeof AudioCtx !== "undefined" ? new AudioCtx() : null;
} catch (err) {
  console.warn("AudioContext unavailable:", err);
}

function playTone(freq, duration, type = "sine") {
  if (!audioCtx) return;
  try {
    if (audioCtx.state === "suspended") audioCtx.resume().catch(() => {});
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch {
    // Ignore audio failures (autoplay policy, missing device, etc.).
  }
}

export function playSound(type) {
  switch (type) {
    case "outgoing":
      playTone(1200, 0.08);
      break;
    case "incoming":
      playTone(800, 0.12);
      setTimeout(() => playTone(1000, 0.12), 120);
      break;
    case "typing":
      playTone(600, 0.05);
      break;
  }
}
