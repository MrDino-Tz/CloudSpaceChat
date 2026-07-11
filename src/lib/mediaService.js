import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

async function fetchAllMessages(conversationId, max = 100) {
  const q = query(
    collection(db, "messages"),
    where("conversationId", "==", conversationId),
    limit(max),
  );
  const snap = await getDocs(q);
  const result = [];
  snap.forEach((d) => result.push({ id: d.id, ...d.data() }));
  result.sort((a, b) => {
    const ta = a.timestamp?.toDate?.() || new Date(0);
    const tb = b.timestamp?.toDate?.() || new Date(0);
    return tb - ta;
  });
  return result;
}

export async function fetchSharedMedia(conversationId, maxItems = 6) {
  const messages = await fetchAllMessages(conversationId);
  const items = [];
  messages.forEach((msg) => {
    (msg.attachments || []).forEach((att) => {
      if (att.type === "image" || att.type === "video") {
        items.push({ ...att, messageId: msg.id, timestamp: msg.timestamp });
      }
    });
  });
  return items.slice(0, maxItems);
}

export async function fetchSharedFiles(conversationId, maxItems = 4) {
  const messages = await fetchAllMessages(conversationId);
  const items = [];
  messages.forEach((msg) => {
    (msg.attachments || []).forEach((att) => {
      if (att.type === "file" || att.type === "document" || att.type === "application") {
        items.push({ ...att, messageId: msg.id, timestamp: msg.timestamp });
      }
    });
  });
  return items.slice(0, maxItems);
}

export async function fetchSharedLinks(conversationId, maxItems = 3) {
  const messages = await fetchAllMessages(conversationId);
  const links = [];
  messages.forEach((msg) => {
    const matches = (msg.content || "").match(URL_REGEX);
    if (matches) {
      matches.forEach((url) => {
        if (!links.find((l) => l.url === url)) {
          links.push({ url, title: extractDomain(url), messageId: msg.id });
        }
      });
    }
  });
  return links.slice(0, maxItems);
}

export async function fetchMediaCount(conversationId) {
  const messages = await fetchAllMessages(conversationId, 200);
  let count = 0;
  messages.forEach((msg) => {
    count += (msg.attachments || []).filter((a) => a.type === "image" || a.type === "video").length;
  });
  return count;
}

function extractDomain(url) {
  try {
    const u = new URL(url);
    return u.hostname.replace("www.", "").charAt(0).toUpperCase() + u.hostname.replace("www.", "").slice(1);
  } catch {
    return url;
  }
}
