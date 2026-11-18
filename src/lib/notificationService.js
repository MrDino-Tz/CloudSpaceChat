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

/** FCM Messaging setup for cross-platform push notifications. */
let fcmToken = null;

/** Request notification permission and get FCM token. */
export async function requestFCMPermissionAndToken() {
  try {
    const perm = await Notification.requestPermission();
    if (perm !== "granted") return null;

    // Check if firebase is available
    if (typeof firebase === "undefined" || !firebase.messaging) return null;

    const messaging = firebase.messaging();
    const token = await messaging.getToken({
      vapidKey: "BNPOXIjZo9zTYd5xmIkYaKxGFQUeEiyonSHvm0qDfZYo=",
    });

    if (token) {
      fcmToken = token;
      console.log("FCM token obtained:", token);
    }

    return token;
  } catch (err) {
    console.warn("FCM token request failed:", err);
    return null;
  }
}

/** Subscribe to push notifications via Service Worker. */
export async function subscribePush() {
  try {
    const registration = await getRegistration();
    if (!registration) return null;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: await urlBase64ToV8Base64(
        "BNPOXIjZo9zTYd5xmIkYaKxGFQUeEiyonSHvm0qDfZYo=",
      ),
    });

    return subscription;
  } catch (err) {
    console.warn("Push subscription failed:", err);
    return null;
  }
}

/** Helper to convert base64 to ArrayBuffer for VAPID key. */
function urlBase64ToV8Base64(base64String) {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/** Send a push notification to all subscribed clients. */
export async function sendPushNotification(title, body, options = {}) {
  try {
    const sub = await subscribePush();
    if (!sub) return;

    const payload = {
      notification: {
        title,
        body,
        icon: `${baseUrl()}csclogo.png`,
        badge: `${baseUrl()}csclogo.png`,
      },
      data: {
        url: options.url || `${baseUrl()}chatroom/`,
        conversationId: options.conversationId || null,
      },
    };

    await fetch(`https://fcm.googleapis.com/fcm/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "key=BNPOXIjZo9zTYd5xmIkYaKxGFQUeEiyonSHvm0qDfZYo=",
      },
      body: JSON.stringify({
        subscription: sub,
        payload,
      }),
    });
  } catch (err) {
    console.warn("Push send failed:", err);
  }
}

/** Play system sound for notifications. */
let audioCtx = null;
try {
  audioCtx = typeof window.AudioContext !== "undefined" ? new window.AudioContext() : null;
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
    // Ignore audio failures.
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

/** Check if currently in DND window. */
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

/** Show a notification in the browser. */
export async function sendNotification(title, body, options = {}) {
  if (!typeof window !== "undefined" || "Notification" in window === false) return;
  if (Notification.permission !== "granted") return;

  // Try service worker showNotification first (works on mobile browsers)
  const registration = await getRegistration();
  if (registration?.showNotification) {
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
      await registration.showNotification(title, notificationOptions);
      return;
    } catch (err) {
      console.warn("Service worker showNotification failed:", err);
    }
  }

  // Desktop fallback. Mobile browsers reject this constructor, so keep the
  // guard and swallow the error rather than crashing the app.
  try {
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
    new Notification(title, notificationOptions);
  } catch (err) {
    console.warn("Notification constructor unavailable:", err);
  }
}export { fcmToken };  // Re-export for use in other modules
