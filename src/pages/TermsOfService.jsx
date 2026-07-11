import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import '../components/ui/AuthPage.css';

export default function TermsOfService() {
  return (
    <div className="auth-root" style={{ overflowY: 'auto' }}>
      <div className="auth-container" style={{ padding: '40px 16px', minHeight: '100vh', justifyContent: 'flex-start' }}>
        <Link to="/" className="auth-back-btn" style={{ position: 'relative', alignSelf: 'flex-start', marginBottom: '20px', left: 0, top: 0 }}>
          <ChevronLeft style={{ width: 16, height: 16 }} />
          Back to Home
        </Link>
        
        <div className="auth-card" style={{ maxWidth: '800px', backgroundColor: '#fff', padding: '32px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px', color: '#111827' }}>Terms of Service</h1>
          <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Last updated: July 2026</p>
          
          <div style={{ color: '#374151', lineHeight: '1.6', fontSize: '15px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p>Welcome to CloudSpace. By accessing or using our services, you agree to be bound by these Terms of Service.</p>
            
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: '16px' }}>1. Acceptance of Terms</h2>
            <p>By registering an account and using the CloudSpace application, you agree to comply with all applicable laws and regulations and these Terms of Service. If you do not agree, you must not use the service.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: '16px' }}>2. User Responsibilities</h2>
            <p>You are responsible for maintaining the security of your account and credentials. You agree not to use the service for any illegal, harmful, or abusive activities, including the transmission of malicious software, spam, or abusive content.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: '16px' }}>3. Content Ownership</h2>
            <p>You retain ownership of all messages, files, and media you transmit through CloudSpace. By using the service, you grant us a license to process and transmit this content solely for the purpose of operating the chat platform.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: '16px' }}>4. Termination</h2>
            <p>We reserve the right to suspend or terminate your access to the service at any time, with or without cause, including for violations of these Terms of Service.</p>

            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: '16px' }}>5. Limitation of Liability</h2>
            <p>CloudSpace is provided "as is" without warranties of any kind. We are not liable for any damages arising from your use of the service, including data loss or service interruptions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
