import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/auth';
import { Spinner } from '@/components/ui';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuthStore();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg">
        <Spinner size={24} />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" replace />;
}
