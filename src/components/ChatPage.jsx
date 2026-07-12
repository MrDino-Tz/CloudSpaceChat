import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listenToConversations, listenToMessages, sendMessage, getConversation, createPrivateConversation, deleteMessageForMe, deleteMessageForEveryone, editMessage, toggleStarMessage } from "@/lib/chatService";
import { getUserProfile, searchUsers, getAllUsers } from "@/lib/userService";
import { usePresence } from "@/hooks/usePresence";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { SidePanel } from "@/components/SidePanel";
import { FilePreviewModal } from "@/components/FilePreviewModal";
import { SettingsModal } from "@/components/SettingsModal";
import { GroupCreateModal } from "@/components/GroupCreateModal";
import { getLocalSettings, applyStyleOverrides } from "@/lib/settingsService";
import { requestNotificationPermission, sendNotification, isInDnd, playSound } from "@/lib/notificationService";

function ConversationItem({ conv, active, onClick }) {
  const { user } = useAuth();
  const otherUid = conv.participants?.find((p) => p !== user.uid);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (otherUid) getUserProfile(otherUid).then(setOtherUser);
  }, [otherUid]);

  const name = conv.type === "group" ? conv.name : otherUser?.displayName || "User";
  const lm = conv.lastMessage || {};
  const hasLink = lm.content && LINK_RX.test(lm.content);
  const preview = lm.type === "image" ? "📷 Photo" : lm.type === "video" ? "🎥 Video" : lm.type === "file" ? `📎 ${lm.attachments?.[0]?.name || "File"}` : hasLink ? "🔗 Link" : lm.content || "No messages yet";
  const isOnline = otherUser?.isOnline;

  return (
    <div className={`chat-item ${active ? "active" : ""}`} onClick={onClick}>
      <div className="chat-avatar-container">
        {otherUser?.avatar ? (
          <img className="chat-avatar" src={getAvatarUrl(otherUser)} alt="" />
        ) : (
          <div className="chat-avatar chat-avatar-letter">{getAvatarFallback(name)}</div>
        )}
        <div className={`status-dot ${isOnline ? "status-online" : "status-offline"}`} />
      </div>
      <div className="chat-info">
        <div className="chat-header-row">
          <span className="chat-name">{name}</span>
        </div>
        <div className="chat-preview-row">
          <span className="chat-preview">{preview}</span>
        </div>
      </div>
    </div>
  );
}

const FILE_EXT_COLORS = {
  docx: { bg: "#dbeafe", color: "#2563eb" }, doc: { bg: "#dbeafe", color: "#2563eb" },
  xls: { bg: "#dcfce7", color: "#16a34a" }, xlsx: { bg: "#dcfce7", color: "#16a34a" },
  pdf: { bg: "#fee2e2", color: "#dc2626" },
  ppt: { bg: "#ffedd5", color: "#ea580c" }, pptx: { bg: "#ffedd5", color: "#ea580c" },
  svg: { bg: "#f3e8ff", color: "#9333ea" },
  zip: { bg: "#f3f4f6", color: "#6b7280" }, rar: { bg: "#f3f4f6", color: "#6b7280" },
  txt: { bg: "#f3f4f6", color: "#6b7280" },
};

function getFileBadge(name) {
  const ext = name?.split(".").pop()?.toLowerCase();
  return FILE_EXT_COLORS[ext] || { bg: "#f3f4f6", color: "#6b7280" };
}

function formatSize(bytes) {
  if (!bytes) return "";
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + " MB";
  return Math.round(bytes / 1024) + " KB";
}

const LINK_RX = /(https?:\/\/[^\s]+)/g;

const SUSPICIOUS_TLDS = new Set([
  "tk", "ml", "ga", "cf", "gq", "xyz", "top", "loan", "win",
  "bid", "date", "men", "trade", "webcam", "review", "download",
]);

const SHORTENERS = new Set([
  "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
  "buff.ly", "shorturl.at", "rebrand.ly", "cutt.ly", "tiny.cc",
]);

const PHISHING_KEYWORDS = ["login", "signin", "verify", "secure", "account", "bank", "paypal"];

function checkLinkSafety(url) {
  try {
    const u = new URL(url);
    const hostname = u.hostname;
    const isHttps = u.protocol === "https:";
    const hasAt = url.includes("@");
    const parts = hostname.replace("www.", "").split(".");
    const tld = parts[parts.length - 1];
    const domain = parts.slice(-2).join(".");
    const name = parts[0];

    const flags = [];

    if (!isHttps) flags.push("no-https");
    if (hasAt) flags.push("contains-@");
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) flags.push("ip-address");
    if (SUSPICIOUS_TLDS.has(tld)) flags.push("suspicious-tld");
    if (SHORTENERS.has(hostname) || SHORTENERS.has(domain)) flags.push("shortener");
    if (name.length > 30) flags.push("long-domain");
    if (PHISHING_KEYWORDS.some((kw) => name.includes(kw) || hostname.includes(kw))) flags.push("phishing-keyword");
    if (SAFE_DOMAINS.has(domain) || domain.endsWith(".google.com")) flags.push("safe-domain");
    if (flags.length === 0) flags.push("unknown");

    let level = "safe";
    if (flags.includes("ip-address") || flags.includes("contains-@")) level = "suspicious";
    else if (flags.includes("no-https") || flags.includes("suspicious-tld") || flags.includes("phishing-keyword")) level = "suspicious";
    else if (flags.includes("safe-domain") && !flags.includes("no-https")) level = "safe";
    else level = "unknown";

    return { level, flags };
  } catch {
    return { level: "unknown", flags: [] };
  }
}

function renderContent(text, onLinkClick, settings) {
  if (!text) return null;
  const parts = text.split(LINK_RX);
  const scanner = settings?.linkScanner || "standard";
  const customTrusted = (settings?.trustedDomains || "").split(",").map((d) => d.trim()).filter(Boolean);

  const isTrusted = (url) => {
    try {
      const host = new URL(url).hostname.replace("www.", "");
      return customTrusted.some((d) => host === d || host.endsWith("." + d));
    } catch { return false; }
  };

  return parts.map((part, i) => {
    if (!LINK_RX.test(part)) return part;

    if (scanner === "disabled") {
      return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="msg-link" onClick={(e) => e.stopPropagation()}>{part}</a>;
    }

    if (scanner === "standard") {
      const { level } = checkLinkSafety(part);
      if (level === "safe" || isTrusted(part)) {
        return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="msg-link" onClick={(e) => e.stopPropagation()}>{part}</a>;
      }
    }

    const { level } = checkLinkSafety(part);
    const levelClass = level === "safe" ? "link-safe" : level === "suspicious" ? "link-suspicious" : "link-unknown";
    return (
      <span key={i} className="link-badge-wrapper" onClick={() => onLinkClick?.(part)}>
        <span className={`link-badge-dot ${levelClass}`} />
        <span className="msg-link">{part}</span>
      </span>
    );
  });
}

const CheckTicks = ({ read, incognito }) => {
  const showRead = !incognito && read;
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={showRead ? "#3b82f6" : "#9ca3af"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}>
      <polyline points="18 6 11 15 7 11" />
      {showRead && <polyline points="22 6 15 15 13 13" />}
    </svg>
  );
};

function MediaPlaceholder({ label, icon, onLoad }) {
  return (
    <div className="media-placeholder" onClick={onLoad}>
      <span className="media-placeholder-icon">{icon}</span>
      <span className="media-placeholder-label">{label}</span>
    </div>
  );
}

// ── SVG icon helpers for context menu ──
const CtxReplyIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg>;
const CtxCopyIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>;
const CtxStarIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const CtxUnstarIcon   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const CtxEditIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;
const CtxInfoIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>;
const CtxTrashIcon    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
const CtxFlagIcon     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>;

function MessageContextMenu({ isOwn, isStarred, onReply, onCopy, onStar, onEdit, onDeleteForMe, onDeleteForAll, onReport, onInfo, onClose, anchorPos }) {
  const menuRef = useRef(null);

  useEffect(() => {
    const handle = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  const items = isOwn
    ? [
        { icon: <CtxReplyIcon />, label: "Reply", action: onReply },
        { icon: <CtxCopyIcon />, label: "Copy", action: onCopy },
        { icon: isStarred ? <CtxUnstarIcon /> : <CtxStarIcon />, label: isStarred ? "Unstar" : "Star", action: onStar },
        { icon: <CtxEditIcon />, label: "Edit", action: onEdit },
        { icon: <CtxInfoIcon />, label: "Info", action: onInfo },
        { divider: true },
        { icon: <CtxTrashIcon />, label: "Delete for Me", action: onDeleteForMe, danger: true },
        { icon: <CtxTrashIcon />, label: "Delete for Everyone", action: onDeleteForAll, danger: true },
      ]
    : [
        { icon: <CtxReplyIcon />, label: "Reply", action: onReply },
        { icon: <CtxCopyIcon />, label: "Copy", action: onCopy },
        { icon: isStarred ? <CtxUnstarIcon /> : <CtxStarIcon />, label: isStarred ? "Unstar" : "Star", action: onStar },
        { divider: true },
        { icon: <CtxTrashIcon />, label: "Delete for Me", action: onDeleteForMe, danger: true },
        { icon: <CtxFlagIcon />, label: "Report", action: onReport, danger: true },
      ];

  const style = {
    position: "fixed",
    top: Math.min(anchorPos.y, window.innerHeight - 320),
    left: Math.min(anchorPos.x, window.innerWidth - 210),
    zIndex: 9999,
  };

  return (
    <div ref={menuRef} className="msg-context-menu" style={style}>
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="msg-context-divider" />
        ) : (
          <button
            key={i}
            className={`msg-context-item ${item.danger ? "danger" : ""}`}
            onClick={() => { item.action?.(); onClose(); }}
          >
            <span className="msg-context-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      )}
    </div>
  );
}

function MessageInfoModal({ msg, onClose }) {
  const [readUsers, setReadUsers] = useState([]);
  const [deliveredUsers, setDeliveredUsers] = useState([]);

  useEffect(() => {
    (async () => {
      if (msg.readBy?.length) {
        const profiles = await Promise.all(msg.readBy.map((uid) => getUserProfile(uid)));
        setReadUsers(profiles.filter(Boolean));
      }
      if (msg.deliveredTo?.length) {
        const profiles = await Promise.all(msg.deliveredTo.map((uid) => getUserProfile(uid)));
        setDeliveredUsers(profiles.filter(Boolean));
      }
    })();
  }, [msg]);

  const sentDate = msg.timestamp?.toDate?.();
  const sentFull = sentDate
    ? sentDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : "—";
  const editedDate = msg.edited?.toDate?.() || (msg.edited instanceof Date ? msg.edited : null);
  const editedFull = editedDate
    ? editedDate.toLocaleString([], { dateStyle: "medium", timeStyle: "short" })
    : null;

  const msgType = msg.attachments?.length
    ? msg.attachments.map((a) => a.type).join(", ")
    : "text";
  const charCount = msg.content?.length || 0;

  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal-box msg-info-modal">
        <div className="modal-header">
          <div className="modal-title-row">
            <span className="modal-brand">Message Info</span>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Message preview */}
          <div className="msg-info-preview">
            <div className="msg-info-preview-text">
              {msg.content || (msg.attachments?.length ? `[${msgType}]` : "—")}
            </div>
          </div>

          {/* Details grid */}
          <div className="msg-info-details">
            <div className="msg-info-row">
              <span className="msg-info-label">Sent</span>
              <span className="msg-info-value">{sentFull}</span>
            </div>
            {editedFull && (
              <div className="msg-info-row">
                <span className="msg-info-label">Edited</span>
                <span className="msg-info-value">{editedFull}</span>
              </div>
            )}
            <div className="msg-info-row">
              <span className="msg-info-label">Type</span>
              <span className="msg-info-value msg-info-badge">{msgType}</span>
            </div>
            <div className="msg-info-row">
              <span className="msg-info-label">Characters</span>
              <span className="msg-info-value">{charCount}</span>
            </div>
            {msg.starredBy?.length > 0 && (
              <div className="msg-info-row">
                <span className="msg-info-label">Starred by</span>
                <span className="msg-info-value">{msg.starredBy.length} user(s)</span>
              </div>
            )}
          </div>

          {/* Read by section */}
          <div className="msg-info-section">
            <div className="msg-info-section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Read by · {readUsers.length}
            </div>
            {readUsers.length === 0 ? (
              <div className="msg-info-empty">No read receipts yet</div>
            ) : (
              <div className="msg-info-user-list">
                {readUsers.map((u) => (
                  <div key={u.uid} className="msg-info-user">
                    {u.avatar ? (
                      <img className="msg-info-user-avatar" src={u.avatar} alt="" />
                    ) : (
                      <div className="msg-info-user-avatar msg-info-user-letter">{getAvatarFallback(u.displayName)}</div>
                    )}
                    <div className="msg-info-user-name">{u.displayName || "User"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivered to section */}
          <div className="msg-info-section">
            <div className="msg-info-section-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              Delivered to · {deliveredUsers.length}
            </div>
            {deliveredUsers.length === 0 ? (
              <div className="msg-info-empty">No delivery info</div>
            ) : (
              <div className="msg-info-user-list">
                {deliveredUsers.map((u) => (
                  <div key={u.uid} className="msg-info-user">
                    {u.avatar ? (
                      <img className="msg-info-user-avatar" src={u.avatar} alt="" />
                    ) : (
                      <div className="msg-info-user-avatar msg-info-user-letter">{getAvatarFallback(u.displayName)}</div>
                    )}
                    <div className="msg-info-user-name">{u.displayName || "User"}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isOwn, onPreview, onLinkClick, onReply, settings }) {
  const { user, profile } = useAuth();
  const [sender, setSender] = useState(null);
  const [loadedMedia, setLoadedMedia] = useState({});
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y }
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(msg.content || "");
  const [starred, setStarred] = useState(msg.starredBy?.includes(user?.uid) || false);
  const time = msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";

  const shouldAutoLoad = (type) => {
    if (!settings) return true;
    if (type === "image") return settings.autoDownloadImages !== false;
    if (type === "video") return settings.autoDownloadVideo !== false;
    if (type === "audio") return settings.autoDownloadAudio !== false;
    return true;
  };

  const loadMedia = (i) => setLoadedMedia((prev) => ({ ...prev, [i]: true }));

  useEffect(() => {
    if (!isOwn) getUserProfile(msg.senderId).then(setSender);
  }, [msg.senderId, isOwn]);

  const openCtx = (e) => {
    e.preventDefault();
    setCtxMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCopy = () => {
    if (msg.content) navigator.clipboard.writeText(msg.content).catch(() => {});
  };

  const handleStar = async () => {
    const next = await toggleStarMessage(msg.id, user.uid);
    setStarred(next);
  };

  const handleEdit = () => {
    setEditText(msg.content || "");
    setEditing(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (editText.trim() && editText.trim() !== msg.content) {
      await editMessage(msg.id, editText.trim());
    }
    setEditing(false);
  };

  const [showInfo, setShowInfo] = useState(false);

  const handleDeleteForMe = () => {
    if (window.confirm("Remove this message from your view?")) deleteMessageForMe(msg.id, user.uid);
  };

  const handleDeleteForAll = () => {
    if (window.confirm("Delete this message for everyone?")) deleteMessageForEveryone(msg.id);
  };

  const handleReport = () => window.alert("Message reported. Thank you for keeping CloudSpace safe.");
  const handleInfo = () => setShowInfo(true);

  return (
    <div
      className={`message-wrapper ${isOwn ? "outgoing" : "incoming"}`}
      onContextMenu={openCtx}
    >
      {!isOwn && (
        sender?.avatar
          ? <img className="msg-avatar" src={sender.avatar} alt="" style={{ objectFit: "cover" }} />
          : <div className="msg-avatar msg-avatar-letter-sm">{getAvatarFallback(sender?.displayName || msg.senderId)}</div>
      )}
      <div className="message-content">
        {!isOwn && <div className="message-sender">{sender?.displayName || "User"}</div>}

        {/* Reply-to quote */}
        {msg.replyTo && (
          <div className="msg-reply-quote">
            <span className="msg-reply-bar" />
            <span className="msg-reply-text">{msg.replyTo.content || "Attachment"}</span>
          </div>
        )}

        <div className="message-bubble">
          {msg.attachments?.map((att, i) => {
            if (att.type === "image") {
              if (!shouldAutoLoad("image") && !loadedMedia[i]) {
                return <MediaPlaceholder key={i} label="Tap to load image" icon="🖼" onLoad={() => loadMedia(i)} />;
              }
              return <img key={i} src={att.url} alt="" className="msg-attachment-img" onClick={() => onPreview?.({ type: "image", url: att.url })} />;
            }
            if (att.type === "video") {
              if (!shouldAutoLoad("video") && !loadedMedia[i]) {
                return <MediaPlaceholder key={i} label="Tap to load video" icon="🎬" onLoad={() => loadMedia(i)} />;
              }
              return (
                <video key={i} src={att.url} controls className="msg-attachment-video" onClick={() => onPreview?.({ type: "video", url: att.url })} />
              );
            }
            if (att.type === "audio") {
              if (!shouldAutoLoad("audio") && !loadedMedia[i]) {
                return <MediaPlaceholder key={i} label="Tap to load audio" icon="🎵" onLoad={() => loadMedia(i)} />;
              }
              return (
                <div key={i} className="audio-attachment">
                  <div className="audio-play-btn">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </div>
                  <div className="audio-waveform">
                    {[...Array(24)].map((_, j) => <div key={j} className="waveform-bar" style={{ height: (20 + Math.random() * 80) + "%" }} />)}
                  </div>
                  <div className="audio-time">0:40</div>
                  {isOwn && profile?.avatar && <img className="audio-avatar" src={profile.avatar} alt="" />}
                  {isOwn && !profile?.avatar && <div className="audio-avatar" style={{background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white'}}>{getAvatarFallback(profile?.displayName)}</div>}
                  {!isOwn && sender?.avatar && <img className="audio-avatar" src={sender.avatar} alt="" />}
                  {!isOwn && !sender?.avatar && <div className="audio-avatar" style={{background: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'white'}}>{getAvatarFallback(sender?.displayName)}</div>}
                </div>
              );
            }
            const ext = att.name?.split(".").pop()?.toLowerCase();
            const previewTypes = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv"];
            const canPreview = previewTypes.includes(ext);
            const badge = getFileBadge(att.name);
            return (
              <div key={i} className={`file-attachment ${canPreview ? "file-previewable" : ""}`} onClick={() => canPreview && onPreview?.({ type: "document", url: att.url, name: att.name, ext })}>
                <div className="file-icon" style={{ background: badge.bg, color: badge.color }}>
                  {badge.color ? (att.name?.split(".").pop() || "FILE").toUpperCase() : "FILE"}
                </div>
                <div className="file-details">
                  <div className="file-name">{att.name}</div>
                  {att.size && <div className="file-size">{formatSize(att.size)}</div>}
                </div>
              </div>
            );
          })}

          {editing ? (
            <form onSubmit={handleEditSubmit} className="msg-edit-form">
              <input
                className="msg-edit-input"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                autoFocus
              />
              <div className="msg-edit-actions">
                <button type="button" onClick={() => setEditing(false)} className="msg-edit-btn cancel">Cancel</button>
                <button type="submit" className="msg-edit-btn save">Save</button>
              </div>
            </form>
          ) : (
            msg.content && !["📷 Photo", "🎥 Video", "📎 File"].includes(msg.content) && (
              <div style={{ marginTop: msg.attachments?.length ? 6 : 0 }}>
                {renderContent(msg.content, onLinkClick, settings)}
                {msg.edited && <span className="msg-edited-tag"> (edited)</span>}
              </div>
            )
          )}
        </div>

        <div className="message-meta">
          {starred && <span className="msg-star-indicator">★</span>}
          <span>{time}</span>
          {isOwn && <CheckTicks read={msg.readBy?.length > 1} incognito={settings?.incognito} />}
        </div>
      </div>

      {ctxMenu && (
        <MessageContextMenu
          isOwn={isOwn}
          isStarred={starred}
          anchorPos={ctxMenu}
          onReply={() => onReply?.(msg)}
          onCopy={handleCopy}
          onStar={handleStar}
          onEdit={handleEdit}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForAll={handleDeleteForAll}
          onReport={handleReport}
          onInfo={handleInfo}
          onClose={() => setCtxMenu(null)}
        />
      )}

      {showInfo && <MessageInfoModal msg={msg} onClose={() => setShowInfo(false)} />}
    </div>
  );
}

const DOC_VIEWER = "https://docs.google.com/viewer?embedded=true&url=";

function PreviewModal({ item, onClose }) {
  if (!item) return null;
  return (
    <div className="image-viewer-backdrop" onClick={onClose}>
      <button className="image-viewer-close" onClick={onClose}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      {item.type === "image" && (
        <img src={item.url} alt="" className="image-viewer-img" onClick={(e) => e.stopPropagation()} />
      )}

      {item.type === "video" && (
        <video src={item.url} controls autoPlay className="image-viewer-img video-viewer" onClick={(e) => e.stopPropagation()} />
      )}

      {item.type === "document" && (
        <div className="doc-viewer-wrapper" onClick={(e) => e.stopPropagation()}>
          <div className="doc-viewer-header">
            <span className="doc-viewer-name">{item.name}</span>
            <a className="doc-viewer-download" href={item.url} target="_blank" rel="noopener noreferrer" download={item.name}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Download
            </a>
          </div>
          <iframe
            className="doc-viewer-iframe"
            src={`${DOC_VIEWER}${encodeURIComponent(item.url)}`}
            title={item.name}
          />
          <div className="doc-viewer-fallback">
            <a href={item.url} target="_blank" rel="noopener noreferrer" className="doc-viewer-fallback-link">
              Open in new tab →
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

const SAFE_DOMAINS = new Set([
  "google.com", "youtube.com", "github.com", "facebook.com",
  "twitter.com", "x.com", "linkedin.com", "instagram.com",
  "whatsapp.com", "cloudinary.com", "firebase.google.com",
]);

function LinkSecurityDialog({ url, onClose }) {
  let domain = "";
  let isHttps = false;
  let isSafe = false;
  try {
    const u = new URL(url);
    domain = u.hostname;
    isHttps = u.protocol === "https:";
    isSafe = SAFE_DOMAINS.has(domain) || domain.endsWith(".google.com");
  } catch { domain = url; }

  const handleVisit = () => {
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="link-dialog-backdrop" onClick={onClose}>
      <div className="link-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="link-dialog-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Link Security Check
        </div>

        <div className="link-dialog-url">{url}</div>

        {isSafe && (
          <div className="link-dialog-safe">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            Known safe domain
          </div>
        )}

        <div className="link-dialog-info">
          <strong>Connection:</strong> {isHttps ? "🔒 HTTPS (encrypted)" : "⚠️ HTTP (not encrypted)"}<br />
          <strong>Domain:</strong> {domain}
        </div>

        <div className="link-dialog-tools">
          <div className="link-dialog-tools-label">Check with free tools</div>
          <a className="link-dialog-tool-item" href={`https://www.virustotal.com/gui/url/${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            VirusTotal
          </a>
          <a className="link-dialog-tool-item" href={`https://urlscan.io/search/#${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            URLScan.io
          </a>
          <a className="link-dialog-tool-item" href={`https://transparencyreport.google.com/safe-browsing/search?url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            Google Safe Browsing
          </a>
        </div>

        <div className="link-dialog-actions">
          <button className="link-dialog-btn link-dialog-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="link-dialog-btn link-dialog-btn-visit" onClick={handleVisit}>Visit link</button>
        </div>
      </div>
    </div>
  );
}

function MessageInput({ conversationId, senderId, onFileSelect, settings, replyTo, onCancelReply, onMessageSent }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const fileRef = useRef(null);
  const menuRef = useRef(null);
  const typingSoundTimer = useRef(null);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!settings?.soundTyping) return;
    if (!typingSoundTimer.current) {
      playSound("typing");
      typingSoundTimer.current = setTimeout(() => { typingSoundTimer.current = null; }, 400);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId, senderId, {
        content: text.trim(),
        replyTo: replyTo ? { id: replyTo.id, content: replyTo.content, senderId: replyTo.senderId } : null,
      });
      setText("");
      onMessageSent?.();
      if (settings?.soundOutgoing) playSound("outgoing");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleAttach = (accept, mediaType) => {
    setMenuOpen(false);
    fileRef.current.accept = accept;
    fileRef.current.dataset.mediaType = mediaType;
    fileRef.current.click();
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaType = e.target.dataset.mediaType || "file";
    const previewUrl = URL.createObjectURL(file);
    onFileSelect({ file, type: mediaType, previewUrl });
    e.target.value = "";
  };

  return (
    <form className="input-area" onSubmit={handleSend}>
      {replyTo && (
        <div className="reply-preview-bar">
          <div className="reply-preview-content">
            <span className="reply-preview-label">Replying to</span>
            <span className="reply-preview-text">{replyTo.content || "Attachment"}</span>
          </div>
          <button type="button" className="reply-preview-cancel" onClick={onCancelReply}>✕</button>
        </div>
      )}
      <div className="input-container">
        <div className="attach-wrapper" ref={menuRef}>
          <div className="attach-btn" onClick={() => setMenuOpen(!menuOpen)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
            </svg>
          </div>
          {menuOpen && (
            <div className="attach-menu">
              <div className="attach-menu-item" onClick={() => handleAttach("image/*", "image")}>
                <span className="attach-menu-icon attach-menu-icon-image">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                </span>
                <span>Image</span>
              </div>
              <div className="attach-menu-item" onClick={() => handleAttach("video/*", "video")}>
                <span className="attach-menu-icon attach-menu-icon-video">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
                </span>
                <span>Video</span>
              </div>
              <div className="attach-menu-item" onClick={() => handleAttach(".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar", "file")}>
                <span className="attach-menu-icon attach-menu-icon-file">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                </span>
                <span>File</span>
              </div>
            </div>
          )}
        </div>
        <input type="file" ref={fileRef} style={{ display: "none" }} onChange={handleFile} />
        <input type="text" className="msg-input" placeholder="Type a message..." value={text} onChange={handleTyping} />
        <button className="send-btn" type="submit" disabled={sending}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </form>
  );
}


function UserSearchResult({ foundUser, onStartChat }) {
  return (
    <div className="chat-item" onClick={() => onStartChat(foundUser)}>
      <div className="chat-avatar-container">
        {foundUser.avatar ? (
          <img className="chat-avatar" src={getAvatarUrl(foundUser)} alt="" />
        ) : (
          <div className="chat-avatar chat-avatar-letter">{getAvatarFallback(foundUser.displayName)}</div>
        )}
        <div className={`status-dot ${foundUser.isOnline ? "status-online" : "status-offline"}`} />
      </div>
      <div className="chat-info">
        <div className="chat-header-row">
          <span className="chat-name">{foundUser.displayName}</span>
        </div>
        <div className="chat-preview-row">
          <span className="chat-preview">@{foundUser.username}{foundUser.bio ? ` \u2022 ${foundUser.bio}` : ""}</span>
        </div>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { user, profile, logout } = useAuth();
  const [view, setView] = useState("chats");
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [settings, setSettings] = useState(getLocalSettings());
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [foundUsers, setFoundUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionError, setActionError] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const [previewItem, setPreviewItem] = useState(null);
  const [pendingLink, setPendingLink] = useState(null);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const newBtnRef = useRef(null);
  const messagesEnd = useRef(null);

  usePresence(user);
  const prevMsgLen = useRef(0);

  useEffect(() => { requestNotificationPermission(); }, []);

  useEffect(() => {
    const close = (e) => {
      if (newBtnRef.current && !newBtnRef.current.contains(e.target)) setShowNewMenu(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  useEffect(() => {
    applyStyleOverrides(settings);
  }, [settings]);

  useEffect(() => {
    if (!settings.notificationsEnabled && !settings.soundIncoming) return;
    if (messages.length <= prevMsgLen.current) { prevMsgLen.current = messages.length; return; }
    const latest = messages[messages.length - 1];
    if (!latest || latest.senderId === user?.uid) { prevMsgLen.current = messages.length; return; }
    if (isInDnd(settings.dndEnabled, settings.dndStart, settings.dndEnd)) { prevMsgLen.current = messages.length; return; }
    if (settings.notificationsEnabled) sendNotification("New message", latest.content || "Sent an attachment");
    if (settings.soundIncoming) playSound("incoming");
    prevMsgLen.current = messages.length;
  }, [messages, settings, user?.uid]);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToConversations(
      user.uid,
      setConversations,
      (err) => setActionError("Chat list error: " + err.message),
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!activeConvId) return;
    setRecipient(null);
    getConversation(activeConvId).then((conv) => {
      setActiveConv(conv);
      if (conv?.type === "private") {
        const otherUid = conv.participants.find((p) => p !== user.uid);
        if (otherUid) getUserProfile(otherUid).then(setRecipient);
      }
    });
    const unsub = listenToMessages(activeConvId, setMessages);
    return unsub;
  }, [activeConvId, user.uid]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (view !== "find-people") {
      setFoundUsers([]);
      return;
    }
    setSearching(true);
    setActionError("");
    const timer = setTimeout(async () => {
      try {
        const results = searchTerm.trim()
          ? await searchUsers(searchTerm, user.uid)
          : await getAllUsers(user.uid);
        setFoundUsers(results);
      } catch (err) {
        setActionError("Failed to load users: " + (err.message || "Check Firestore rules"));
      }
      setSearching(false);
    }, searchTerm.trim() ? 300 : 0);
    return () => clearTimeout(timer);
  }, [searchTerm, view, user.uid]);

  const startChatWithUser = useCallback(async (foundUser) => {
    if (startingChat) return;
    setStartingChat(true);
    setActionError("");
    try {
      const convId = await createPrivateConversation(user.uid, foundUser.uid);
      setActiveConvId(convId);
      setView("chats");
      setSearchTerm("");
    } catch (err) {
      console.error("Failed to create conversation:", err);
      setActionError(err.message || "Failed to start chat. Check Firestore rules.");
    } finally {
      setStartingChat(false);
    }
  }, [user.uid, startingChat]);

  const convName = activeConv?.type === "group"
    ? activeConv.name
    : recipient?.displayName || "Loading...";

  const avatarName = profile?.displayName || user?.email || "U";

  return (
    <div className="app-window">
      <div className="sidebar">
        <div className="sidebar-avatar-wrapper" onClick={() => setShowProfile(true)} title="Edit profile">
          {profile?.avatar ? (
            <img src={getAvatarUrl(profile)} alt="avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar profile-avatar-letter-lg">{getAvatarFallback(avatarName)}</div>
          )}
        </div>
        <div className={`nav-item ${view === "chats" ? "active" : ""}`} onClick={() => setView("chats")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Chats</span>
        </div>
        <div className={`nav-item ${view === "find-people" ? "active" : ""}`} onClick={() => setView("find-people")}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
            <line x1="11" y1="8" x2="11" y2="14" />
          </svg>
          <span>Find People</span>
        </div>
        <div className="spacer" />
        <div className="nav-item" onClick={() => setShowSettings(true)} title="Settings">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
          <span>Settings</span>
        </div>
        <div className="nav-item" onClick={logout} title="Sign out">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          <span>Logout</span>
        </div>
      </div>

      <div className="chat-list-panel">
        <div className="chat-list-header">
          <span className="chat-list-title">Chats</span>
          <div className="new-btn-wrapper" ref={newBtnRef}>
            <button className="new-chat-btn" onClick={() => setShowNewMenu(!showNewMenu)}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            {showNewMenu && (
              <div className="new-chat-dropdown">
                <div className="new-chat-option" onClick={() => { setShowNewMenu(false); setView("find-people"); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                  <span>New Chat</span>
                </div>
                <div className="new-chat-option" onClick={() => { setShowNewMenu(false); setShowGroupCreate(true); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                  <span>New Group</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              className="search-input"
              placeholder={view === "find-people" ? "Search by name or @username..." : "Search chats..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        {actionError && (
          <div style={{ padding: "8px 16px", background: "#fef2f2", color: "#dc2626", fontSize: 13, borderBottom: "1px solid #fecaca" }}>
            {actionError}
          </div>
        )}
        <div className="chat-list">
          {view === "chats" ? (
            conversations.length === 0 ? (
              <div style={{ padding: "20px", textAlign: "center", color: "#8a8d91", fontSize: 14 }}>
                No conversations yet. Use <strong>Find People</strong> to start one.
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationItem key={conv.id} conv={conv} active={conv.id === activeConvId} onClick={() => setActiveConvId(conv.id)} />
              ))
            )
          ) : searching ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#8a8d91", fontSize: 14 }}>
              Searching...
            </div>
          ) : foundUsers.length === 0 && searchTerm.trim() ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#8a8d91", fontSize: 14 }}>
              No users found matching "{searchTerm}"
            </div>
          ) : foundUsers.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", color: "#8a8d91", fontSize: 14 }}>
              No users found
            </div>
          ) : (
            foundUsers.map((u) => (
              <UserSearchResult key={u.uid} foundUser={u} onStartChat={startChatWithUser} />
            ))
          )}
        </div>
      </div>

      <div className="main-chat">
        {activeConvId ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info" style={{ display: "flex", alignItems: "center", gap: 12 }} onClick={() => setShowSidePanel(!showSidePanel)}>
                {recipient ? (
                  <div className="chat-avatar-container" style={{ margin: 0 }}>
                    {recipient.avatar ? (
                      <img className="chat-avatar" src={getAvatarUrl(recipient)} alt="" style={{ width: 40, height: 40 }} />
                    ) : (
                      <div className="chat-avatar chat-avatar-letter" style={{ width: 40, height: 40, fontSize: 16 }}>
                        {getAvatarFallback(recipient.displayName)}
                      </div>
                    )}
                    <div className={`status-dot ${recipient.isOnline ? "status-online" : "status-offline"}`} />
                  </div>
                ) : activeConv?.type === "group" && activeConv.avatar ? (
                  <img className="chat-avatar" src={activeConv.avatar} alt="" style={{ width: 40, height: 40 }} />
                ) : activeConv?.type === "group" ? (
                  <div className="chat-avatar chat-avatar-letter" style={{ width: 40, height: 40, fontSize: 16 }}>
                    {getAvatarFallback(activeConv.name)}
                  </div>
                ) : null}
                <div>
                  <div className="chat-title">{convName}</div>
                  <div className="chat-subtitle">
                    {activeConv?.type === "group"
                      ? `${activeConv.participants?.length || 0} members`
                      : recipient
                        ? `@${recipient.username || "user"} \u2022 ${recipient.isOnline ? "online" : "offline"}`
                        : ""}
                  </div>
                </div>
              </div>
              <div className="chat-actions">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="19" cy="12" r="1" />
                  <circle cx="5" cy="12" r="1" />
                </svg>
              </div>
            </div>

            <div className="messages-container">
              {messages.map((msg) => (
                msg.isDeleted ? null : <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === user.uid} onPreview={setPreviewItem} onLinkClick={setPendingLink} onReply={setReplyTo} settings={settings} />
              ))}
              <div ref={messagesEnd} />
            </div>

            <MessageInput conversationId={activeConvId} senderId={user.uid} onFileSelect={setPendingFile} settings={settings} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onMessageSent={() => setReplyTo(null)} />
            {pendingFile && (
              <FilePreviewModal
                data={pendingFile}
                conversationId={activeConvId}
                senderId={user.uid}
                onClose={() => {
                  URL.revokeObjectURL(pendingFile.previewUrl);
                  setPendingFile(null);
                }}
              />
            )}
          </>
        ) : (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#8a8d91" }}>
            Select a conversation to start chatting
          </div>
        )}
      </div>

      <div className={`right-panel ${!showSidePanel ? "hidden" : ""}`}>
        <SidePanel
          conversation={activeConv}
          currentUserId={user?.uid}
          onClose={() => setShowSidePanel(false)}
        />
      </div>

      {showProfile && <ProfileEditModal onClose={() => setShowProfile(false)} />}
      {showSettings && <SettingsModal onClose={() => { setShowSettings(false); setSettings(getLocalSettings()); }} />}
      {showGroupCreate && <GroupCreateModal onClose={() => setShowGroupCreate(false)} onCreated={(id) => setActiveConvId(id)} />}

      {previewItem && (
        <PreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      )}

      {pendingLink && <LinkSecurityDialog url={pendingLink} onClose={() => setPendingLink(null)} />}
    </div>
  );
}
