import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth, hasRole } from '../auth.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navItems = [
    { to: '/inbox', label: 'Inbox', icon: '💬' },
    { to: '/leads', label: 'Leads', icon: '👤' },
    { to: '/reminders', label: 'Reminders', icon: '⏰' },
  ];
  if (hasRole(user, 'ADMIN')) {
    navItems.push({ to: '/users',  label: 'Users',    icon: '🛡️' });
    navItems.push({ to: '/roles',  label: 'Roles',    icon: '🔑' });
    navItems.push({ to: '/channels', label: 'Channels', icon: '📡' });
  } else if (hasRole(user, 'MANAGER')) {
    navItems.push({ to: '/channels', label: 'Channels', icon: '📡' });
  }

  function doLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="flex h-screen">
      <aside className="w-60 bg-slate-900 text-slate-100 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="font-semibold text-lg">Immigration CRM</div>
          <div className="text-xs text-slate-400">Phase 1 - Unified Inbox</div>
        </div>
        <nav className="flex-1 py-2 overflow-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-brand-600 text-white' : 'hover:bg-slate-800'
                }`
              }
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        {user && (
          <div className="px-5 py-4 border-t border-slate-800">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-slate-400 mb-2">{user.role}</div>
            <button
              onClick={doLogout}
              className="w-full text-xs px-2 py-1.5 rounded border border-slate-700 hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        )}
      </aside>
      <main className="flex-1 overflow-hidden bg-slate-50">
        <Outlet />
      </main>
    </div>
  );
}
