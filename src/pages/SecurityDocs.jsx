import { useEffect, useState, useRef } from 'react';

const sections = [
  { id: 'what-is-e2ee', label: 'End-to-End Encryption' },
  { id: 'faq', label: 'FAQ' },
  { id: 'key-management', label: 'Key Management' },
  { id: 'data-retention', label: 'Data Retention' },
];

const SecurityDocs = () => {
  const [activeId, setActiveId] = useState(sections[0].id);
  const ticking = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY + 100;
        let current = sections[0].id;
        for (const s of sections) {
          const el = document.getElementById(s.id);
          if (el && el.offsetTop <= scrollY) {
            current = s.id;
          }
        }
        setActiveId((prev) => (prev !== current ? current : prev));
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#fff',
      color: '#202124',
      fontFamily: '"Google Sans", Roboto, "Segoe UI", Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <style>{`
        .gd-content a { color: #1a73e8; text-decoration: none; }
        .gd-content a:hover { text-decoration: underline; }
        .gd-content h2 { font-size: 24px; font-weight: 500; margin: 48px 0 16px; color: #202124; scroll-margin-top: 80px; }
        .gd-content h3 { font-size: 18px; font-weight: 500; margin: 32px 0 12px; color: #202124; }
        .gd-content p { font-size: 14px; line-height: 1.7; color: #5f6368; margin: 0 0 16px; }
        .gd-content ul, .gd-content ol { font-size: 14px; line-height: 1.7; color: #5f6368; margin: 0 0 16px; padding-left: 24px; }
        .gd-content li { margin-bottom: 6px; }
        .gd-content table { width: 100%; border-collapse: collapse; margin: 0 0 24px; font-size: 14px; }
        .gd-content th { background: #f8f9fa; text-align: left; padding: 12px 16px; border-bottom: 2px solid #dadce0; font-weight: 500; color: #202124; }
        .gd-content td { padding: 12px 16px; border-bottom: 1px solid #e8eaed; color: #5f6368; }
        .gd-content blockquote { border-left: 4px solid #1a73e8; padding: 12px 16px; margin: 0 0 24px; background: #f8f9fa; border-radius: 0 8px 8px 0; font-size: 14px; color: #5f6368; }
        .gd-content .note { background: #e8f0fe; border-radius: 8px; padding: 16px 20px; margin: 0 0 24px; font-size: 14px; color: #202124; border-left: 4px solid #1a73e8; }
        @media (max-width: 768px) {
          .docs-sidebar { display: none !important; }
          .gd-content { padding: 24px 20px !important; }
        }
      `}</style>

      <header style={{
        background: '#fff',
        borderBottom: '1px solid #dadce0',
        padding: '0 24px',
        height: 56,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ color: '#5f6368', fontSize: 14, fontWeight: 500 }}>CloudSpaceChat</span>
          <span style={{ color: '#dadce0', fontSize: 13 }}>/</span>
          <span style={{ color: '#1a73e8', fontSize: 14 }}>Security & End-to-End Encryption</span>
        </div>
        <a href="/" style={{
          color: '#1a73e8',
          fontSize: 13,
          textDecoration: 'none',
          fontWeight: 500,
          padding: '6px 16px',
          borderRadius: 20,
          border: '1px solid #dadce0',
        }}>Return to Chat</a>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <nav style={{
          width: 260,
          flexShrink: 0,
          borderRight: '1px solid #dadce0',
          padding: '24px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          position: 'sticky',
          top: 56,
          alignSelf: 'flex-start',
          height: 'calc(100vh - 56px)',
          overflowY: 'auto',
        }} className="docs-sidebar">
          <div style={{ fontSize: 11, fontWeight: 500, color: '#5f6368', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 12, paddingLeft: 12 }}>
            Security & Privacy
          </div>
          {sections.map((s) => {
            const isActive = activeId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => scrollTo(s.id)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: isActive ? 500 : 400,
                  color: isActive ? '#1a73e8' : '#5f6368',
                  background: isActive ? '#e8f0fe' : 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {s.label}
              </button>
            );
          })}
        </nav>

        <main className="gd-content" style={{ flex: 1, maxWidth: 800, padding: '40px 56px', minWidth: 0 }}>
          <h1 style={{ fontSize: 36, fontWeight: 500, color: '#202124', margin: '0 0 8px', lineHeight: 1.3 }}>
            Security & End-to-End Encryption
          </h1>
          <p style={{ fontSize: 14, color: '#5f6368', margin: '0 0 32px' }}>
            This document explains how CloudSpaceChat protects your data and what End-to-End Encryption means for your conversations.
          </p>

          <div className="note">
            <strong style={{ fontSize: 14 }}>Page Summary</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, color: '#202124', lineHeight: 1.6 }}>
              <li>End-to-End Encryption ensures only you and the recipient can read your messages.</li>
              <li>Encryption keys are stored locally on your devices, not on our servers.</li>
              <li>Group chats, media files, and calls are all protected by E2EE.</li>
            </ul>
          </div>

          <h2 id="what-is-e2ee">What is End-to-End Encryption?</h2>
          <p>
            End-to-End Encryption (E2EE) is a security method that ensures only the communicating users can read the messages.
            No third party, not even CloudSpaceChat, has access to the decryption keys needed to read the messages.
          </p>
          <p>
            When you send a message, it is encrypted on your device with a unique key. The encrypted message travels through our servers,
            but only the recipient's device has the corresponding key to decrypt and read it. This all happens automatically&mdash;no settings to toggle.
          </p>

          <blockquote>
            <strong>Note:</strong> E2EE protects messages in transit and at rest. Even if our servers were compromised, your
            message contents remain unreadable without the decryption keys stored only on your device.
          </blockquote>

          <h2 id="faq">Frequently Asked Questions</h2>

          <h3>Does CloudSpaceChat store my messages?</h3>
          <p>
            Messages are stored on our servers in encrypted form. The encryption keys needed to read them exist only on the
            sender's and recipient's devices. This means we cannot read your messages even if we wanted to.
          </p>

          <h3>Are group chats encrypted?</h3>
          <p>
            Yes. Group chats use the same encryption protocols. Each participant has a unique key that allows them to
            decrypt messages, ensuring privacy among all group members.
          </p>

          <h3>What about media files?</h3>
          <p>
            Photos, videos, voice notes, and documents are encrypted using E2EE before they leave your device. They remain
            encrypted during transmission and while stored on our servers.
          </p>

          <h2 id="key-management">Key Management</h2>
          <p>
            Encryption keys are generated and stored locally on each device. When you sign in on a new device,
            the keys are securely shared between your devices using CloudSpaceChat's key exchange protocol.
          </p>
          <p>If you lose all your devices, you can regenerate your keys, but old messages encrypted with previous keys will not be recoverable.</p>

          <div className="note">
            For security reasons, CloudSpaceChat does not have access to your encryption keys.
            We cannot recover messages if you lose your devices without a backup.
          </div>

          <h2 id="data-retention">Data Retention</h2>
          <table>
            <thead>
              <tr>
                <th>Data Type</th>
                <th>Retention</th>
                <th>Encrypted</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>Messages</td><td>Until deleted by user</td><td>E2EE</td></tr>
              <tr><td>Media files</td><td>Until deleted by user</td><td>E2EE</td></tr>
              <tr><td>Account info</td><td>Until account deletion</td><td>TLS in transit</td></tr>
              <tr><td>Metadata</td><td>90 days</td><td>TLS in transit</td></tr>
            </tbody>
          </table>

          <p>
            You can delete your messages, media, or entire account at any time through the app settings.
            When you delete a message, it is purged from our servers within 30 days.
          </p>

          <hr style={{ border: 'none', borderTop: '1px solid #dadce0', margin: '48px 0 24px' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, color: '#5f6368' }}>Was this article helpful?</span>
            <button style={{
              background: '#fff', border: '1px solid #dadce0', padding: '6px 20px',
              borderRadius: 20, cursor: 'pointer', fontSize: 14, color: '#202124',
            }}>Yes</button>
            <button style={{
              background: '#fff', border: '1px solid #dadce0', padding: '6px 20px',
              borderRadius: 20, cursor: 'pointer', fontSize: 14, color: '#202124',
            }}>No</button>
          </div>
        </main>
      </div>

      <footer style={{
        background: '#f8f9fa', borderTop: '1px solid #dadce0',
        padding: '24px', textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: '#80868b', margin: 0 }}>
          &copy; {new Date().getFullYear()} CloudSpaceChat. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default SecurityDocs;