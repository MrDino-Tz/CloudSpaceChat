import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/ui/AuthPage';
import { HomePage } from '@/components/HomePage';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';

function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <HomePage /> : <AuthPage />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  );
}

export default App;


