import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import '../components/ui/AuthPage.css';

export default function PrivacyPolicy() {
  return (
    <div className="auth-root" style={{ overflowY: 'auto' }}>
      <div className="auth-container" style={{ padding: '40px 16px', minHeight: '100vh', justifyContent: 'flex-start' }}>
        <Link to="/" className="auth-back-btn" style={{ position: 'relative', alignSelf: 'flex-start', marginBottom: '20px', left: 0, top: 0 }}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back to Home
        </Link>
        
        <div className="auth-card" style={{ maxWidth: '800px', backgroundColor: 'var(--bg-white)', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--text-main)' }}>Privacy Policy</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Last updated: July 2026</p>
          
          <div style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p>At CloudSpaceChat, we value your privacy. This policy outlines how we collect, use, and protect your personal information.</p>
            
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginTop: '16px' }}>1. Information We Collect</h2>
            <p>We collect information you provide directly, such as your username, email address, and profile details during registration. We also collect the content of the messages and files you send through the platform.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginTop: '16px' }}>2. How We Use Information</h2>
            <p>Your information is used strictly to provide, maintain, and improve the CloudSpaceChat service. This includes authenticating your account, delivering messages, and notifying you of platform updates.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginTop: '16px' }}>3. Data Security</h2>
            <p>We implement industry-standard security measures to protect your personal data from unauthorized access or disclosure. However, no internet transmission is entirely secure, and we cannot guarantee absolute security.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginTop: '16px' }}>4. Link Security Scanning</h2>
            <p>To protect our users from malicious websites, CloudSpaceChat includes an automatic Link Security Scanning feature. This feature evaluates URLs shared in messages using client-side heuristics (such as checking for trusted domains, HTTPS encryption, and suspicious patterns).</p>
            <p><strong>Important Privacy Notice:</strong> This auto-detection runs entirely locally on your device (client-side). We do <strong>not</strong> send the links you click or view to our servers for security analysis. If you choose to use the optional third-party free scanning tools provided in the link dialog (such as VirusTotal, URLScan.io, or Google Safe Browsing), the URL will be sent to those external services, and your interaction will be subject to their respective privacy policies.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginTop: '16px' }}>5. Data Sharing</h2>
            <p>We do not sell your personal data. We may share information with trusted third-party service providers (such as hosting platforms) solely for the purpose of operating the service, subject to strict confidentiality agreements.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', marginTop: '16px' }}>6. Your Rights</h2>
            <p>You have the right to access, modify, or delete your personal data. You can request account deletion at any time, which will remove your profile and associated data from our active servers.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
