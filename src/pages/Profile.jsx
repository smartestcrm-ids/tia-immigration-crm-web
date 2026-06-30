import { useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';

export default function Profile() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }
    if (form.newPassword === form.currentPassword) {
      setError('New password must be different from your current one.');
      return;
    }

    setSubmitting(true);
    try {
      await api.changePassword(form.currentPassword, form.newPassword);
      setSuccess(true);
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e) {
      setError(e.message || 'Could not change password.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!user) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <header className="px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Profile</h1>
        <p className="text-sm text-slate-500">Your account details and password.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 max-w-5xl">
        {/* Account info */}
        <section className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-semibold mb-3">Account</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between">
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Role</dt>
              <dd>
                <span className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded">
                  {user.role}
                </span>
              </dd>
            </div>
            {user.createdAt && (
              <div className="flex justify-between">
                <dt className="text-slate-500">Member since</dt>
                <dd>{new Date(user.createdAt).toLocaleDateString()}</dd>
              </div>
            )}
          </dl>
          <p className="text-xs text-slate-500 mt-4">
            To change your name, email or role, ask an administrator.
          </p>
        </section>

        {/* Change password */}
        <section className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-semibold mb-1">Change password</h2>
          <p className="text-xs text-slate-500 mb-4">
            New password must be at least 8 characters and different from your current one.
          </p>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Current password</label>
              <input
                type="password"
                required
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Confirm new password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded px-3 py-2">
                Password updated. Use the new one next time you sign in.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-3 py-2 bg-brand-600 text-white text-sm rounded hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Updating…' : 'Update password'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
