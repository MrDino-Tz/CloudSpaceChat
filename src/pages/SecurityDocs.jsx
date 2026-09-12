import { useState, useEffect } from 'react';

function PageSummary() {
  return (
    <div className="note">
      <strong>Page Summary</strong>
      <ul style={{ margin: '8px 0 0', paddingLeft: 20, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
        <li>All traffic between your device and our services is encrypted in transit (HTTPS/TLS).</li>
        <li>Access is gated by Firebase Authentication and Firestore security rules that restrict message reads to conversation participants.</li>
        <li>Media (photos, videos, voice notes, files) is stored via Cloudinary with secure delivery.</li>
        <li>Links in chats are scanned and suspicious URLs are flagged before you open them.</li>
        <li><strong>CloudSpaceChat is not end-to-end encrypted.</strong> Messages are stored on our servers and are readable by authorized service administrators. Do not use it to exchange information you need to keep hidden from the platform.</li>
      </ul>
    </div>
  );
}

function OverviewContent() {
  return (
    <>
      <PageSummary />

      <p>CloudSpaceChat is a real-time messaging platform. The frontend is a single-page React 19 + Vite app that talks directly to its cloud services from the browser — there is no custom application server in the path.</p>
      <p>The platform is built on three main services:</p>
      <ul>
        <li><strong>Firebase Authentication</strong> — identity: every device signs in through Firebase Auth before it can use any feature.</li>
        <li><strong>Cloud Firestore</strong> — the database: users, conversations, messages, chat requests, and notifications are stored as Firestore documents and pushed to devices in real time.</li>
        <li><strong>Cloudinary</strong> — media: images, videos, audio/voice notes, and files are uploaded to Cloudinary, with a reference to the file stored in the message.</li>
      </ul>
      <p><strong>How a message flows:</strong> you type or attach media to the chat input → if there is media, it is uploaded to Cloudinary over HTTPS first → the message content and any attachment URLs are written to a Firestore <code>messages</code> document → Firestore security rules verify you are a participant of that conversation → the document is created and the other participants' devices update in real time.</p>
      <p>All of this happens inside the browser using the official Firebase and Cloudinary SDKs. Nothing is routed through a server we operate, which means every rule that governs who may read and write data is enforced by the <strong>Firestore security rules</strong> and the <strong>Cloudinary upload/delivery settings</strong>.</p>

      <h3>What data is stored</h3>
      <table>
        <thead>
          <tr><th>Collection</th><th>What it holds</th></tr>
        </thead>
        <tbody>
          <tr><td><code>users</code></td><td>Profile: display name, username, email, optional bio and avatar URL</td></tr>
          <tr><td><code>conversations</code></td><td>Private and group chats: participants, last message, pinned/archived/muted state, typing and unread counters</td></tr>
          <tr><td><code>messages</code></td><td>Each message: sender, text content, type (text/photo/video/file/audio), timestamp, read/delivered state, reactions, reply details, and attachment URLs</td></tr>
          <tr><td><code>chat_requests</code> &amp; <code>notifications</code></td><td>The friend-request OTP verification flow and in-app notifications</td></tr>
        </tbody>
      </table>

      <p>Because message contents are readable server-side, our protections are about <em>authentication, access control, and transport security</em> — not end-to-end encryption.</p>
    </>
  );
}

function HowProtectedContent() {
  return (
    <>
      <ul>
        <li><strong>In transit (TLS/HTTPS)</strong> — every request between your device, Firebase, and Cloudinary travels over an encrypted HTTPS connection.</li>
        <li><strong>Authentication</strong> — Firebase Auth ensures every database operation is tied to a signed-in account.</li>
        <li><strong>Access control</strong> — Firestore rules limit conversation/message reads to participants; users may only update their own profile.</li>
        <li><strong>Media security</strong> — files are uploaded directly to Cloudinary from the client and delivered over HTTPS; there are no public directory listings.</li>
        <li><strong>Link scanning</strong> — URLs in chats are scanned and marked safe/suspicious/untrusted before you open them.</li>
      </ul>

      <blockquote><strong>Rules reference:</strong> the production ruleset lives in <code>docs/Firestore-Security-Rules.md</code>. A permissive rule set is used during development; the production ruleset enforces participant-only access.</blockquote>

      <h3>Encryption</h3>
      <p>Cloud infrastructure (Google Cloud / Firebase, Cloudinary) encrypts data while stored and TLS protects it in transit. This is <strong>infrastructure &amp; transport encryption</strong> — there are no per-user decryption keys, no device-side key exchange, and no client-side encryption in the current implementation.</p>
    </>
  );
}

function FaqContent() {
  return (
    <>
      <h3>Is my chat end-to-end encrypted?</h3>
      <p>No. Chat messages are transmitted over HTTPS and stored in Cloud Firestore, where the service can read them. What protects them from other users is authentication plus Firestore security rules. Do not use CloudSpaceChat to exchange secrets that must stay hidden from the platform.</p>

      <h3>Who can read my messages?</h3>
      <p>You, the recipients, and anyone with administrative access to the database (app maintainers, Firebase/Google Cloud operators). Other app users cannot read them, enforced by security rules.</p>

      <h3>Are group chats protected?</h3>
      <p>Yes. Group messages are only readable by the group's participants, enforced by the same Firestore rules.</p>

      <h3>What about media files?</h3>
      <p>Photos, videos, voice notes, and documents are uploaded to Cloudinary over HTTPS and opened through secure delivery URLs. Like text messages, they are protected by access rules and transport encryption but are <strong>not</strong> end-to-end encrypted.</p>

      <h3>Does CloudSpaceChat scan links?</h3>
      <p>Yes. Links in chats are checked by the link-safety scanner and suspicious or untrusted URLs are flagged before you open them. See <code>docs/link-security-scanning.md</code> for details.</p>
    </>
  );
}

function RetentionContent() {
  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Data Type</th>
            <th>Retention</th>
            <th>Protection</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Messages</td><td>Until deleted (soft-delete)</td><td>TLS in transit + Firestore rules</td></tr>
          <tr><td>Media files</td><td>Until removed from Cloudinary</td><td>TLS + secure delivery URL</td></tr>
          <tr><td>Account / profile info</td><td>Until account is removed</td><td>Firestore rules (own-user edit)</td></tr>
          <tr><td>Presence / typing status</td><td>Transient (while sessions are active)</td><td>Participants only</td></tr>
        </tbody>
      </table>

      <p>Deleting a message hides it from the conversation (or only from you, depending on the option chosen). The underlying database document may persist in backups. If you need data removed permanently, contact the platform administrator.</p>

      <div className="note">Contact the administrator to request permanent deletion of your data or account.</div>
    </>
  );
}

const SECTIONS = [
  { id: 'overview', label: 'Overview', component: OverviewContent },
  { id: 'how-we-protect', label: 'How Data Is Protected', component: HowProtectedContent },
  { id: 'faq', label: 'FAQ', component: FaqContent },
  { id: 'data-retention', label: 'Data Retention', component: RetentionContent },
];

const SecurityDocs = () => {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);

  useEffect(() => {
    document.body.style.overflow = 'auto';
    const prevRestore = history.scrollRestoration;
    history.scrollRestoration = 'manual';
    return () => {
      document.body.style.overflow = '';
      history.scrollRestoration = prevRestore;
    };
  }, []);

  // Scroll to top whenever the visible tab changes.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeId]);

  const ActiveContent = SECTIONS.find((s) => s.id === activeId)?.component || OverviewContent;

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
        .gd-body h1 { font-size: 32px; font-weight: 600; color: var(--text-main); margin: 0 0 8px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); }
        .gd-body h2 { font-size: 24px; font-weight: 600; color: var(--text-main); margin: 40px 0 16px; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); }
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
          <span style={{ color: 'var(--primary-color)', fontSize: 14 }}>docs/end-to-end</span>
        </div>
        <a href={import.meta.env.BASE_URL} style={{
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
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveId(s.id)}
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
            <h1>Security & Data Protection</h1>
            <p>This document explains how CloudSpaceChat transmits and stores your data, which protections are in place, and which ones are not.</p>

            <div className="gd-section-tabs">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveId(s.id)}
                  style={{
                    padding: '6px 14px', fontSize: 13, borderRadius: 8,
                    fontWeight: activeId === s.id ? 600 : 400,
                    color: activeId === s.id ? 'var(--text-main)' : 'var(--text-secondary)',
                    background: activeId === s.id ? 'var(--hover-bg)' : 'transparent',
                    border: 'none', cursor: 'pointer', transition: 'background 0.15s',
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <ActiveContent />
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