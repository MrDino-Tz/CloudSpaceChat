import React, { useState } from 'react';
import { 
  Search, MessageSquare, Briefcase, User, Bookmark, 
  Calendar, Folder, Settings, Phone, Video, 
  MoreVertical, Paperclip, Mic, Send, Link2
} from 'lucide-react';

function App() {
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, incoming: true, avatar: "9", sender: "Virginia Jordan", time: "12:38", content: "Hi, I've just finished my report.", hasFile: true },
    { id: 2, outgoing: true, time: "12:42", content: "Great job! How long did it take you?" },
    { id: 3, incoming: true, avatar: "9", sender: "Virginia Jordan", time: "12:49", content: "About two hours. I had to check some data and make sure everything was accurate. I also included the latest sales figures in the appendix." },
    { id: 4, incoming: true, avatar: "10", sender: "Gregory Williams", time: "12:57", content: "Can you send me a copy of the report? I need to review it before we submit it to the boss." },
    { id: 5, incoming: true, avatar: "9", sender: "Virginia Jordan", time: "13:00", content: "Sure, I'll send it right away." },
    { id: 6, outgoing: true, time: "13:05", avatar: "0", content: "I have a question about the report. Did you include the latest sales figures?" },
    { id: 7, incoming: true, avatar: "9", sender: "Virginia Jordan", time: "13:08", content: "Yes, they're in the appendix. They show an increase in sales compared to last month." }
  ]);

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return;
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    
    setMessages([
      ...messages,
      {
        id: Date.now(),
        outgoing: true,
        time: `${hours}:${minutes}`,
        avatar: "0",
        content: inputValue.trim()
      }
    ]);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <div className="app-window">
      {/* 1. Sidebar */}
      <div className="sidebar">
        <img 
          src="https://i.pravatar.cc/150?u=a042581f4e29026024d" 
          alt="Profile" 
          className="profile-avatar"
        />
        
        <a href="#" className="nav-item">
          <MessageSquare size={22} />
          <span>All chats</span>
        </a>
        <a href="#" className="nav-item active">
          <Briefcase size={22} />
          <span>Work</span>
        </a>
        <a href="#" className="nav-item">
          <User size={22} />
          <span>Personal</span>
        </a>
        <a href="#" className="nav-item">
          <Bookmark size={22} />
          <span>Saved</span>
        </a>
        
        <div className="spacer"></div>
        
        <a href="#" className="nav-item">
          <Calendar size={22} />
          <span>Calendar</span>
        </a>
        <a href="#" className="nav-item">
          <Folder size={22} />
          <span>Files</span>
        </a>
        
        <div style={{ height: '20px' }}></div>
        
        <a href="#" className="nav-item">
          <Settings size={22} />
          <span>Settings</span>
        </a>
      </div>

      {/* 2. Chat List Panel */}
      <div className="chat-list-panel">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input type="text" placeholder="Search..." className="search-input" />
            <Search size={18} />
          </div>
        </div>
        
        <div className="chat-list">
          {/* Active Chat Item */}
          <ChatItem name="TechPulse Company" time="13:02" preview="Reminder that we have a project meeti..." active avatar="group1" />

          {/* Chat Items */}
          <ChatItem name="Michelle Davis" time="13:02" preview="Just finished a workout and feeling en..." status="online" avatar="1" />
          <ChatItem name="Joseph King" time="13:02" preview="Please prepare a presentation on the r..." unread={1} avatar="2" />
          <ChatItem name="Brian Alexander" time="13:02" preview="Okay. Please review and approve the a..." unread={4} avatar="3" />
          <ChatItem name="Harry Dennis" time="13:02" preview="Hi. We need to discuss changes to the..." status="online" avatar="4" />
          <ChatItem name="Carolyn Jones" time="13:02" preview="Please report on the tasks completed f..." unread={3} status="online" avatar="5" />
          <ChatItem name="Michael Wallace" time="13:02" preview="Make sure that all documents for the c..." avatar="6" />
          <ChatItem name="Mark Barnett" time="13:02" preview="Hi. Just a reminder that we have a proj..." status="online" avatar="7" />
          <ChatItem name="Lucille Baldwin" time="13:02" preview="Good morning, could you please provid..." avatar="8" />
        </div>
      </div>

      {/* 3. Main Chat Area */}
      <div className="main-chat">
        <div className="chat-header">
          <div 
            className="chat-header-info" 
            onClick={() => setShowRightPanel(!showRightPanel)}
          >
            <div className="chat-title">TechPulse Company</div>
            <div className="chat-subtitle">32 members, 6 online</div>
          </div>
          <div className="chat-actions">
            <Search size={22} />
            <Phone size={22} />
            <Video size={22} />
            <MoreVertical size={22} />
          </div>
        </div>

        <div className="messages-container">
          <div className="date-divider">
            <span className="date-badge">Today</span>
          </div>

          {messages.map(msg => (
            <Message key={msg.id} incoming={msg.incoming} outgoing={msg.outgoing} avatar={msg.avatar} sender={msg.sender} time={msg.time}>
              {msg.hasFile && (
                <div className="file-attachment">
                  <div className="file-icon">PPT</div>
                  <div className="file-details">
                    <div className="file-name">report19-06-24.ppt</div>
                    <div className="file-size">1.2 Mb</div>
                  </div>
                </div>
              )}
              <div>{msg.content}</div>
            </Message>
          ))}
        </div>

        <div className="input-area">
          <div className="input-container">
            <Paperclip className="attach-btn" size={20} />
            <input 
              type="text" 
              placeholder="Your message" 
              className="msg-input" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <Mic className="mic-btn" size={20} />
            <button className="send-btn" onClick={handleSendMessage}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Right Panel */}
      <div className={`right-panel ${showRightPanel ? '' : 'hidden'}`}>
        <div className="right-panel-inner">
          <div className="group-info">
          <img src="https://i.pravatar.cc/150?u=group1" alt="Group" className="group-avatar-large" />
          <div className="group-name">TechPulse Company</div>
          <div className="group-members">32 members</div>
          <div className="group-desc">Company Team Chat: Working together, sharing ideas and communicating effectively!</div>
          <a href="#" className="group-link">@techpulsecom <Link2 size={14}/></a>
        </div>

        <div className="panel-section">
          <div className="section-header">
            <span className="section-title">Members</span>
            <span className="see-all">See all</span>
          </div>
          <div className="members-list">
            <img src="https://i.pravatar.cc/150?u=11" className="member-avatar" alt="M1"/>
            <img src="https://i.pravatar.cc/150?u=12" className="member-avatar" alt="M2"/>
            <img src="https://i.pravatar.cc/150?u=13" className="member-avatar" alt="M3"/>
            <img src="https://i.pravatar.cc/150?u=14" className="member-avatar" alt="M4"/>
            <img src="https://i.pravatar.cc/150?u=15" className="member-avatar" alt="M5"/>
            <div className="more-members">+27</div>
          </div>
        </div>

        <div className="panel-section">
          <div className="section-header">
            <span className="section-title">Photos and videos</span>
            <span className="see-all">See all</span>
          </div>
          <div className="media-grid">
            <img src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&q=80" className="media-item" alt="Media" />
            <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=200&q=80" className="media-item" alt="Media" />
            <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&q=80" className="media-item" alt="Media" />
            <div className="media-item-container">
              <img src="https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=200&q=80" className="media-item" alt="Media" />
              <div className="media-overlay">+178</div>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <div className="section-header">
            <span className="section-title">Shared files</span>
            <span className="see-all">See all</span>
          </div>
          <div>
            <div className="file-list-item">
              <div className="file-icon-small icon-blue">DOCX</div>
              <div className="file-details">
                <div className="file-name">terms_of_reference.docx</div>
                <div className="file-size">3.9 Mb</div>
              </div>
            </div>
            <div className="file-list-item">
              <div className="file-icon-small icon-green">XLS</div>
              <div className="file-details">
                <div className="file-name">contracting_agreement.xls</div>
                <div className="file-size">42 Kb</div>
              </div>
            </div>
            <div className="file-list-item">
              <div className="file-icon-small icon-orange">SVG</div>
              <div className="file-details">
                <div className="file-name">clientlogo.svg</div>
                <div className="file-size">1.2 Mb</div>
              </div>
            </div>
          </div>
        </div>

        <div className="panel-section" style={{ borderBottom: 'none' }}>
          <div className="section-header">
            <span className="section-title">Shared links</span>
            <span className="see-all">See all</span>
          </div>
          <div>
            <div className="link-list-item">
              <div className="link-icon">
                <div style={{width: 20, height: 20, backgroundColor: '#ea4335', borderRadius: 4}}></div>
              </div>
              <div className="link-details">
                <div className="link-name">Google Meet</div>
                <div className="link-url truncate" style={{maxWidth: '180px'}}>meet.google.com/uls-sxqr-rtb</div>
              </div>
            </div>
            <div className="link-list-item">
              <div className="link-icon">
                <div style={{width: 20, height: 20, backgroundColor: '#000', borderRadius: 4}}></div>
              </div>
              <div className="link-details">
                <div className="link-name">Behance</div>
                <div className="link-url truncate" style={{maxWidth: '180px'}}>https://www.behance.net/gallery/187...</div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function ChatItem({ name, time, preview, unread, status, avatar, active }) {
  return (
    <div className={`chat-item ${active ? 'active' : ''}`}>
      <div className="chat-avatar-container">
        <img src={`https://i.pravatar.cc/150?u=${avatar}`} alt={name} className="chat-avatar" />
        {status && <div className={`status-dot status-${status}`}></div>}
      </div>
      <div className="chat-info">
        <div className="chat-header-row">
          <span className="chat-name">{name}</span>
          <span className="chat-time">{time}</span>
        </div>
        <div className="chat-preview-row">
          <span className="chat-preview truncate">{preview}</span>
          {unread ? (
            <div className="unread-badge">{unread}</div>
          ) : (
            <span className="read-status">✓✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

function Message({ incoming, outgoing, sender, time, children, avatar }) {
  return (
    <div className={`message-wrapper ${incoming ? 'incoming' : 'outgoing'}`}>
      {incoming && <img src={`https://i.pravatar.cc/150?u=${avatar}`} alt={sender} className="msg-avatar" />}
      {outgoing && avatar && <img src={`https://i.pravatar.cc/150?u=a042581f4e29026024d`} alt="Me" className="msg-avatar" />}
      
      <div className="message-content">
        {incoming && <div className="message-sender">{sender}</div>}
        <div className="message-bubble">
          {children}
          <div className="message-meta">
            <span>{time}</span>
            {outgoing && <span>✓✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
