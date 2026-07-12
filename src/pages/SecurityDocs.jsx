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
    document.body.style.overflow = 'auto';
    window.scrollTo(0, 0);

    const handleScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const scrollY = window.scrollY + 100;
        let current = sections[0].id;
        for (const s of sections) {
          const el = document.getElementById(s.id);
          if (el && el.offsetTop <= scrollY) current = s.id;
        }
        setActiveId((prev) => (prev !== current ? current : prev));
        ticking.current = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: 'var(--bg-white)',
      color: 'var(--text-main)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans", Helvetica, Arial, sans-serif',
    }}>
      <style>{`
        .gd-body { max-width: 840px; margin: 0 auto; padding: 40px 24px; }
        .gd-body a { color: var(--primary-color); text-decoration: none; }
        .gd-body a:hover { text-decoration: underline; }
        .gd-body h1 { font-size: 32px; font-weight: 600; color: var(--text-main); margin: 0 0 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); scroll-margin-top: 80px; }
        .gd-body h2 { font-size: 24px; font-weight: 600; color: var(--text-main); margin: 40px 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); scroll-margin-top: 80px; }
        .gd-body h3 { font-size: 20px; font-weight: 600; color: var(--text-main); margin: 28px 0 12px; }
        .gd-body p { font-size: 16px; line-height: 1.7; color: var(--text-secondary); margin: 0 0 16px; }
        .gd-body ul, .gd-body ol { font-size: 16px; line-height: 1.7; color: var(--text-secondary); margin: 0 0 16px; padding-left: 24px; }
        .gd-body li { margin-bottom: 4px; }
        .gd-body table { width: 100%; border-collapse: collapse; margin: 0 0 24px; font-size: 14px; border: 1px solid var(--border-color); border-radius: 6px; overflow: hidden; }
        .gd-body th { background: var(--hover-bg); text-align: left; padding: 8px 16px; border-bottom: 1px solid var(--border-color); font-weight: 600; color: var(--text-main); }
        .gd-body td { padding: 8px 16px; border-bottom: 1px solid var(--border-color); color: var(--text-secondary); }
        .gd-body tr:last-child td { border-bottom: none; }
        .gd-body tr:nth-child(even) td { background: var(--hover-bg); }
        .gd-body blockquote { border-left: 4px solid var(--primary-color); padding: 8px 16px; margin: 0 0 16px; background: var(--hover-bg); border-radius: 6px; font-size: 16px; color: var(--text-secondary); }
        .gd-body .note { border: 1px solid var(--primary-color); background: var(--hover-bg); border-radius: 6px; padding: 16px; margin: 0 0 24px; font-size: 14px; color: var(--text-main); }
        .gd-body .note strong { color: var(--primary-color); }
        .gd-body hr { border: none; border-top: 1px solid var(--border-color); margin: 40px 0; }
        @media (max-width: 768px) {
          .gd-sidebar { display: none !important; }
          .gd-body { padding: 24px 16px; }
        }
      `}</style>

      <header style={{
        background: 'var(--bg-white)',
        borderBottom: '1px solid var(--border-color)',
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
          <span style={{ color: 'var(--text-main)', fontSize: 14, fontWeight: 600 }}>CloudSpaceChat</span>
          <span style={{ color: 'var(--border-color)', fontSize: 14 }}>/</span>
          <span style={{ color: 'var(--primary-color)', fontSize: 14 }}>docs/security</span>
        </div>
        <a href="/" style={{
          color: 'var(--text-main)', fontSize: 13, textDecoration: 'none', fontWeight: 500,
          padding: '5px 14px', borderRadius: 6, border: '1px solid var(--border-color)',
          background: 'var(--hover-bg)',
        }}>Back to Chat</a>
      </header>

      <div style={{ display: 'flex' }}>
        <nav style={{
          width: 260, flexShrink: 0, borderRight: '1px solid var(--border-color)',
          padding: '24px 0', display: 'flex', flexDirection: 'column', gap: 2,
          position: 'sticky', top: 56, alignSelf: 'flex-start',
        }} className="gd-sidebar">
          <div style={{ padding: '0 16px 8px', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            On this page
          </div>
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              style={{
                padding: '6px 16px', fontSize: 14,
                fontWeight: activeId === s.id ? 600 : 400,
                color: activeId === s.id ? 'var(--text-main)' : 'var(--text-secondary)',
                background: activeId === s.id ? 'var(--hover-bg)' : 'transparent',
                border: 'none', textAlign: 'left', cursor: 'pointer',
                borderLeft: activeId === s.id ? '2px solid var(--primary-color)' : '2px solid transparent',
                transition: 'all 0.15s',
              }}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="gd-body">
            <h1>Security & End-to-End Encryption</h1>
            <p>This document explains how CloudSpaceChat protects your data and what End-to-End Encryption means for your conversations.</p>

            <div className="note">
              <strong>Page Summary</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <li>End-to-End Encryption ensures only you and the recipient can read your messages.</li>
                <li>Encryption keys are stored locally on your devices, not on our servers.</li>
                <li>Group chats, media files, and calls are all protected by E2EE.</li>
              </ul>
            </div>

            <h2 id="what-is-e2ee">What is End-to-End Encryption?</h2>
            <p>End-to-End Encryption (E2EE) is a security method that ensures only the communicating users can read the messages. No third party, not even CloudSpaceChat, has access to the decryption keys needed to read the messages.</p>
            <p>When you send a message, it is encrypted on your device with a unique key. The encrypted message travels through our servers, but only the recipient's device has the corresponding key to decrypt and read it. This all happens automatically — no settings to toggle.</p>

            <blockquote><strong>Note:</strong> E2EE protects messages in transit and at rest. Even if our servers were compromised, your message contents remain unreadable without the decryption keys stored only on your device.</blockquote>

            <h2 id="faq">Frequently Asked Questions</h2>

            <h3>Does CloudSpaceChat store my messages?</h3>
            <p>Messages are stored on our servers in encrypted form. The encryption keys needed to read them exist only on the sender's and recipient's devices. This means we cannot read your messages even if we wanted to.</p>

            <h3>Are group chats encrypted?</h3>
            <p>Yes. Group chats use the same encryption protocols. Each participant has a unique key that allows them to decrypt messages, ensuring privacy among all group members.</p>

            <h3>What about media files?</h3>
            <p>Photos, videos, voice notes, and documents are encrypted using E2EE before they leave your device. They remain encrypted during transmission and while stored on our servers.</p>

            <h2 id="key-management">Key Management</h2>
            <p>Encryption keys are generated and stored locally on each device. When you sign in on a new device, the keys are securely shared between your devices using CloudSpaceChat's key exchange protocol.</p>
            <p>If you lose all your devices, you can regenerate your keys, but old messages encrypted with previous keys will not be recoverable.</p>

            <div className="note">For security reasons, CloudSpaceChat does not have access to your encryption keys. We cannot recover messages if you lose your devices without a backup.</div>

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

            <p>You can delete your messages, media, or entire account at any time through the app settings. When you delete a message, it is purged from our servers within 30 days.</p>

            <hr />

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Was this article helpful?</span>
              <button style={{
                background: 'var(--hover-bg)', border: '1px solid var(--border-color)',
                padding: '5px 16px', borderRadius: 6, cursor: 'pointer',
                fontSize: 14, color: 'var(--text-main)',
              }}>Yes</button>
              <button style={{
                background: 'var(--hover-bg)', border: '1px solid var(--border-color)',
                padding: '5px 16px', borderRadius: 6, cursor: 'pointer',
                fontSize: 14, color: 'var(--text-main)',
              }}>No</button>
            </div>
          </div>

          <footer style={{
            background: 'var(--bg-white)', borderTop: '1px solid var(--border-color)',
            padding: '16px 24px', textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>
              &copy; {new Date().getFullYear()} CloudSpaceChat. All rights reserved.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default SecurityDocs;