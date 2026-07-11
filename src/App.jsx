import { useAuth } from '@/contexts/AuthContext';
import { AuthPage } from '@/components/ui/AuthPage';
import { HomePage } from '@/components/HomePage';

function App() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return user ? <HomePage /> : <AuthPage />;
}

export default App;


