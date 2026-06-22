import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, hasRole } from '../auth.jsx';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  if (roles && !hasRole(user, ...roles)) {
    return (
      <div className="p-8">
        <h2 className="text-lg font-semibold mb-2">Access denied</h2>
        <p className="text-slate-600">
          You need one of these roles: {roles.join(', ')}.
          Your role is <strong>{user.role}</strong>.
        </p>
      </div>
    );
  }
  return children;
}
