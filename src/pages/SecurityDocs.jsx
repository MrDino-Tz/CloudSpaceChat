import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

const SecurityDocs = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: 'var(--bg-white, #ffffff)', 
      color: 'var(--text-main, #111827)', 
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        backgroundColor: 'var(--brand-dark, #111827)',
        color: '#ffffff',
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/" style={{ color: '#fff', display: 'flex', alignItems: 'center', textDecoration: 'none', fontWeight: 'bold', fontSize: '18px' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '10px', color: 'var(--primary-color, #F59B1D)' }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            CloudSpaceChat <span style={{ fontWeight: '400', marginLeft: '6px', opacity: 0.8 }}>Help Center</span>
          </Link>
        </div>
        <Link to="/" style={{
          color: '#ffffff',
          textDecoration: 'none',
          fontSize: '14px',
          fontWeight: '500',
          padding: '8px 16px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '20px',
          transition: 'background 0.2s'
        }}>
          Return to Chat
        </Link>
      </header>

      {/* Main Content Layout */}
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'row',
        padding: '40px 24px',
        gap: '60px'
      }}>
        
        {/* Desktop Sidebar (hidden on small screens using a media query in CSS normally, but we'll use inline flex logic) */}
        <nav style={{
          width: '240px',
          flexShrink: 0,
          display: window.innerWidth <= 768 ? 'none' : 'block'
        }} className="docs-sidebar">
          <h4 style={{ fontSize: '13px', textTransform: 'uppercase', color: 'var(--text-secondary, #6b7280)', letterSpacing: '1px', marginBottom: '16px' }}>Topics</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-secondary, #4b5563)', fontSize: '15px' }}>General</a></li>
            <li><a href="#" style={{ textDecoration: 'none', color: 'var(--primary-color, #F59B1D)', fontSize: '15px', fontWeight: '600' }}>Security & Privacy</a></li>
            <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-secondary, #4b5563)', fontSize: '15px' }}>Troubleshooting</a></li>
            <li><a href="#" style={{ textDecoration: 'none', color: 'var(--text-secondary, #4b5563)', fontSize: '15px' }}>Account & Profile</a></li>
          </ul>
        </nav>

        {/* Article Content */}
        <main style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '24px', color: 'var(--text-main)' }}>
            Security & End-to-End Encryption
          </h1>
          
          <p style={{ fontSize: '16px', lineHeight: '1.7', color: 'var(--text-secondary)', marginBottom: '32px' }}>
            At CloudSpaceChat, your privacy and security are our top priorities. This document explains how we protect your data and what End-to-End Encryption (E2EE) means for your conversations.
          </p>

          <div style={{ 
            backgroundColor: 'var(--hover-bg, #f3f4f6)', 
            padding: '24px', 
            borderRadius: '12px', 
            marginBottom: '40px',
            borderLeft: '4px solid var(--primary-color, #F59B1D)'
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color, #F59B1D)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              What is End-to-End Encryption?
            </h2>
            <p style={{ fontSize: '15px', lineHeight: '1.6', marginBottom: '16px', color: 'var(--text-main)' }}>
              End-to-End Encryption ensures that only you and the person you're communicating with can read or listen to what is sent. Nobody in between, not even CloudSpaceChat, can decipher your messages, calls, photos, or documents.
            </p>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-main)', margin: 0 }}>
              Your messages are secured with a lock, and only the recipient and you have the special key needed to unlock and read them. All of this happens automatically—there is no need to turn on any special settings to secure your messages.
            </p>
          </div>

          <h3 style={{ fontSize: '22px', fontWeight: '600', borderBottom: '1px solid var(--border-color, #e5e7eb)', paddingBottom: '12px', marginBottom: '24px' }}>
            Frequently Asked Questions
          </h3>

          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px' }}>Does CloudSpaceChat store my messages?</h4>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Messages are stored securely. E2EE ensures that even if our servers were compromised, the contents of the messages remain completely unreadable without the specific decryption keys stored only on your local device.
            </p>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h4 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px' }}>Are group chats encrypted?</h4>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Yes. Group chats use the same robust encryption protocols. Every participant in the group receives a unique key that allows them to read the messages, ensuring privacy among all members.
            </p>
          </div>

          <div style={{ marginBottom: '40px' }}>
            <h4 style={{ fontSize: '17px', fontWeight: '600', marginBottom: '12px' }}>What about my media files?</h4>
            <p style={{ fontSize: '15px', lineHeight: '1.6', color: 'var(--text-secondary)' }}>
              Photos, videos, voice notes, and documents are encrypted using the same end-to-end encryption protocols before they leave your device.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '48px', paddingTop: '32px', borderTop: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Was this article helpful?</span>
            <button style={{ background: 'var(--hover-bg)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-main)' }}>Yes</button>
            <button style={{ background: 'var(--hover-bg)', border: '1px solid var(--border-color)', padding: '6px 16px', borderRadius: '16px', cursor: 'pointer', fontWeight: '500', color: 'var(--text-main)' }}>No</button>
          </div>

        </main>
      </div>
      
      {/* Footer */}
      <footer style={{
        backgroundColor: 'var(--hover-bg, #f9fafb)',
        borderTop: '1px solid var(--border-color, #e5e7eb)',
        padding: '32px 24px',
        textAlign: 'center',
        marginTop: 'auto'
      }}>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
          &copy; {new Date().getFullYear()} CloudSpaceChat. All rights reserved.
        </p>
      </footer>
      
      {/* Hide sidebar natively on mobile via global CSS block */}
      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 768px) {
          .docs-sidebar { display: none !important; }
        }
      `}} />
    </div>
  );
};

export default SecurityDocs;
