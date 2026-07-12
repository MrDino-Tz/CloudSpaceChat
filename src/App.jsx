import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/ui/AuthPage';
import { HomePage } from '@/components/HomePage';
import { applyTheme, getLocalSettings } from '@/lib/settingsService';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SecurityDocs from './pages/SecurityDocs';

function App() {
  const { user, loading } = useAuth();

  useEffect(() => {
    const s = getLocalSettings();
    applyTheme(s.theme || 'dark');
  }, []);

  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#000", color: "#f5f5f5", fontFamily: "Inter, sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <img src={import.meta.env.BASE_URL + "csclogo.png"} alt="CloudSpaceChat" style={{ width: 80, height: 80, margin: "0 auto 16px", display: "block" }} />
          <div className="loading-text">Loading</div>
        </div>
      </div>
    );
  }

  const basename = import.meta.env.BASE_URL || '/';

  return (
    <Router basename={basename}>
      <Routes>
        <Route path="/auth" element={user ? <Navigate to="/chatroom/" replace /> : <AuthPage />} />
        <Route path="/chatroom/" element={user ? <HomePage /> : <Navigate to="/auth" replace />} />
        <Route path="/" element={<Navigate to={user ? "/chatroom/" : "/auth"} replace />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/docs/end-to-end" element={<SecurityDocs />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;


