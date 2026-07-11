import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listenToConversations, listenToMessages, sendMessage, getConversation, createPrivateConversation } from "@/lib/chatService";
import { getUserProfile, searchUsers, getAllUsers } from "@/lib/userService";
import { usePresence } from "@/hooks/usePresence";
import { getAvatarUrl, getAvatarFallback } from "@/lib/avatar";
import { ProfileEditModal } from "@/components/ProfileEditModal";
import { SidePanel } from "@/components/SidePanel";
import { uploadToCloudinary } from "@/lib/cloudinary";

function ConversationItem({ conv, active, onClick }) {
  const { user } = useAuth();
  const otherUid = conv.participants?.find((p) => p !== user.uid);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (otherUid) getUserProfile(otherUid).then(setOtherUser);
  }, [otherUid]);

  const name = conv.type === "group" ? conv.name : otherUser?.displayName || "User";
  const lm = conv.lastMessage || {};
  const preview = lm.type === "image" ? "📷 Photo" : lm.type === "file" ? `📎 ${lm.attachments?.[0]?.name || "File"}` : lm.content || "No messages yet";
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

function MessageBubble({ msg, isOwn }) {
  const [sender, setSender] = useState(null);
  const time = msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";

  useEffect(() => {
    if (!isOwn) getUserProfile(msg.senderId).then(setSender);
  }, [msg.senderId, isOwn]);

  return (
    <div className={`message-wrapper ${isOwn ? "outgoing" : "incoming"}`}>
      {!isOwn && (
        sender?.avatar
          ? <img className="msg-avatar" src={sender.avatar} alt="" style={{ objectFit: "cover" }} />
          : <div className="msg-avatar msg-avatar-letter-sm">{getAvatarFallback(sender?.displayName || msg.senderId)}</div>
      )}
      <div className="message-content">
        {!isOwn && <div className="message-sender">{sender?.displayName || "User"}</div>}
        <div className="message-bubble">
          {msg.attachments?.map((att, i) => (
            att.type === "image"
              ? <img key={i} src={att.url} alt="" style={{ maxWidth: "100%", borderRadius: 8, marginBottom: 4 }} />
              : <div key={i} className="file-attachment">
                  <div className="file-icon">FILE</div>
                  <div className="file-details">
                    <div className="file-name">{att.name}</div>
                    <div className="file-size">{Math.round(att.size / 1024)} KB</div>
                  </div>
                </div>
          ))}
          {msg.content}
        </div>
        <div className="message-meta">
          <span>{time}</span>
          {isOwn && <span className="read-status">{msg.readBy?.length > 1 ? "✓✓" : "✓"}</span>}
        </div>
      </div>
    </div>
  );
}

function MessageInput({ conversationId, senderId }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(conversationId, senderId, { content: text.trim() });
      setText("");
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleAttach = (accept, type) => {
    setMenuOpen(false);
    fileRef.current.accept = accept;
    fileRef.current.dataset.mediaType = type;
    fileRef.current.click();
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const mediaType = e.target.dataset.mediaType || "file";
    setUploading(true);
    setError("");
    setProgress(0);

    const interval = setInterval(() => setProgress((p) => Math.min(p + 10, 90)), 300);

    try {
      const result = await uploadToCloudinary(file);
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setProgress(0), 500);

      await sendMessage(conversationId, senderId, {
        content: text.trim() || (mediaType === "image" ? "📷 Photo" : mediaType === "video" ? "🎥 Video" : "📎 File"),
        type: mediaType,
        attachments: [{ url: result.secure_url, type: mediaType, name: file.name, size: file.size }],
      });
      setText("");
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      setError(err.message.includes("Upload preset") ? "Upload preset 'cloudchat_preset' not found — check Cloudinary settings" : err.message);
      setTimeout(() => setError(""), 4000);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <form className={`input-area ${uploading ? "uploading" : ""}`} onSubmit={handleSend}>
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
        <input type="text" className="msg-input" placeholder={uploading ? "Uploading..." : "Type a message..."} value={text} onChange={(e) => setText(e.target.value)} disabled={uploading} />
        {uploading && <div className="upload-progress" style={{ width: `${progress}%` }} />}
        <button className="send-btn" type="submit" disabled={sending || uploading}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      {error && <div className="upload-error">{error}</div>}
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
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [foundUsers, setFoundUsers] = useState([]);
  const [searching, setSearching] = useState(false);
  const [actionError, setActionError] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [startingChat, setStartingChat] = useState(false);
  const [showSidePanel, setShowSidePanel] = useState(false);
  const messagesEnd = useRef(null);

  usePresence(user);

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
                msg.isDeleted ? null : <MessageBubble key={msg.id} msg={msg} isOwn={msg.senderId === user.uid} />
              ))}
              <div ref={messagesEnd} />
            </div>

            <MessageInput conversationId={activeConvId} senderId={user.uid} />
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
    </div>
  );
}
