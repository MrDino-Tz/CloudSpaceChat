export function formatMsgTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate?.() || new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const day = 86400000;

  const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  if (diff < day && date.getDate() === now.getDate()) {
    return time;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
    return "Yesterday";
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 6);
  if (date > weekAgo) {
    return date.toLocaleDateString([], { weekday: "long" });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  }

  return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}

export function formatConvTime(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate?.() || new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  const day = 86400000;

  if (diff < day && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
    return "Yesterday";
  }

  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function formatDateSeparator(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate?.() || new Date(timestamp);
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
    return "Today";
  }
  if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
    return "Yesterday";
  }
  return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

export function getDateKey(timestamp) {
  if (!timestamp) return "";
  const date = timestamp.toDate?.() || new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}
