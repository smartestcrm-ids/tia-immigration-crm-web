import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('safoura@ids.example');
  const [password, setPassword] = useState('Admin123!');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      const target = location.state?.from || '/inbox';
      navigate(target, { replace: true });
    } catch (e) {
      setError(e.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-brand-700">
      <form
        onSubmit={submit}
        className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-1">Immigration CRM</h1>
        <p className="text-sm text-slate-500 mb-6">Sign in to continue</p>

        <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2 mb-4">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 text-white font-medium py-2.5 rounded hover:bg-brand-700 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        <details className="mt-6 text-xs text-slate-500">
          <summary className="cursor-pointer">Demo accounts</summary>
          <ul className="mt-2 space-y-1 font-mono">
            <li>safoura@ids.example / Admin123! (admin)</li>
            <li>manager@ids.example / Manager123! (manager)</li>
            <li>arman@ids.example / Consultant123! (consultant)</li>
            <li>leila@ids.example / Consultant123! (consultant)</li>
          </ul>
        </details>
      </form>
    </div>
  );
}
