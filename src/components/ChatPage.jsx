import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { listenToConversations, listenToMessages, sendMessage, getConversation } from "@/lib/chatService";
import { getUserProfile } from "@/lib/userService";
import { usePresence } from "@/hooks/usePresence";

function ConversationItem({ conv, active, onClick }) {
  const { user } = useAuth();
  const otherUid = conv.participants?.find((p) => p !== user.uid);
  const [otherUser, setOtherUser] = useState(null);

  useEffect(() => {
    if (otherUid) getUserProfile(otherUid).then(setOtherUser);
  }, [otherUid]);

  const name = conv.type === "group" ? conv.name : otherUser?.displayName || "User";
  const avatar = conv.type === "group"
    ? conv.avatar
    : otherUser?.avatar || `https://ui-avatars.com/api/?name=${name}&background=5F33E1&color=fff`;
  const preview = conv.lastMessage?.content || "No messages yet";
  const isOnline = otherUser?.isOnline;

  return (
    <div className={`chat-item ${active ? "active" : ""}`} onClick={onClick}>
      <div className="chat-avatar-container">
        <img className="chat-avatar" src={avatar} alt="" />
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
  const time = msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || "";

  return (
    <div className={`message-wrapper ${isOwn ? "outgoing" : "incoming"}`}>
      {!isOwn && (
        <img className="msg-avatar" src={`https://ui-avatars.com/api/?name=${msg.senderId}&background=5F33E1&color=fff`} alt="" />
      )}
      <div className="message-content">
        {!isOwn && <div className="message-sender">User</div>}
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

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendMessage(conversationId, senderId, { content: text.trim() });
    setText("");
  };

  return (
    <form className="input-area" onSubmit={handleSend}>
      <div className="input-container">
        <div className="attach-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </div>
        <input type="text" className="msg-input" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} />
        <button className="send-btn" type="submit">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </form>
  );
}

export function ChatPage() {
  const { user, profile, logout } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const messagesEnd = useRef(null);

  usePresence(user);

  useEffect(() => {
    if (!user) return;
    const unsub = listenToConversations(user.uid, setConversations);
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!activeConvId) return;
    getConversation(activeConvId).then(setActiveConv);
    const unsub = listenToMessages(activeConvId, setMessages);
    return unsub;
  }, [activeConvId]);

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const convName = activeConv?.type === "group"
    ? activeConv.name
    : conversations.find((c) => c.id === activeConvId)
        ?.participants?.find((p) => p !== user.uid) || "Loading...";

  return (
    <div className="app-window">
      <div className="sidebar">
        <img
          src={profile?.avatar || `https://ui-avatars.com/api/?name=${profile?.displayName || user?.email}&background=5F33E1&color=fff`}
          alt="avatar"
          className="profile-avatar"
        />
        <div className="nav-item active">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          <span>Chats</span>
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
            <input type="text" className="search-input" placeholder="Search or start a new chat" />
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
        </div>

        <div className="chat-list">
          {conversations.map((conv) => (
            <ConversationItem key={conv.id} conv={conv} active={conv.id === activeConvId} onClick={() => setActiveConvId(conv.id)} />
          ))}
        </div>
      </div>

      <div className="main-chat">
        {activeConvId ? (
          <>
            <div className="chat-header">
              <div className="chat-header-info">
                <div className="chat-title">{convName}</div>
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
    </div>
  );
}
