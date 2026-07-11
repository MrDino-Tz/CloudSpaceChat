export function requestNotificationPermission() {
  if (!("Notification" in window)) return;
  if (Notification.permission === "default") {
    Notification.requestPermission();
  }
}

export function sendNotification(title, body) {
  if (!("Notification" in window)) return;
  if (Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
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

const audioCtx = typeof AudioCtx !== "undefined" ? new AudioCtx() : null;

function playTone(freq, duration, type = "sine") {
  if (!audioCtx) return;
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
