import { useEffect, useState } from 'react';
import { api } from '../api.js';

const ROLES = ['CONSULTANT', 'MANAGER', 'ADMIN'];

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ email: '', name: '', password: '', role: 'CONSULTANT' });

  async function load() {
    setLoading(true);
    try {
      setUsers(await api.users());
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function createUser(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.registerUser(form);
      setForm({ email: '', name: '', password: '', role: 'CONSULTANT' });
      setShowForm(false);
      await load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function setRole(userId, role) {
    await api.updateUser(userId, { role });
    load();
  }

  async function toggleActive(user) {
    await api.updateUser(user.id, { active: !user.active });
    load();
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Users</h1>
          <p className="text-sm text-slate-500">Manage who can access the system and at what level.</p>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded hover:bg-brand-700"
        >
          {showForm ? 'Cancel' : '+ New user'}
        </button>
      </header>

      {showForm && (
        <form
          onSubmit={createUser}
          className="px-6 py-4 border-b bg-slate-50 grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
        >
          <div>
            <label className="block text-xs text-slate-600 mb-1">Name</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Email</label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Password</label>
            <input
              required
              minLength={6}
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Role</label>
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <button className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm">
            Create
          </button>
          {error && (
            <div className="md:col-span-5 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
              {error}
            </div>
          )}
        </form>
      )}

      <div className="flex-1 overflow-auto bg-white">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Email</th>
                <th className="text-left px-6 py-3">Role</th>
                <th className="text-left px-6 py-3">Active</th>
                <th className="text-left px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-6 py-3 font-medium">{u.name}</td>
                  <td className="px-6 py-3 text-slate-600">{u.email}</td>
                  <td className="px-6 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => setRole(u.id, e.target.value)}
                      className="border rounded px-2 py-1 text-sm"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => toggleActive(u)}
                      className={`text-xs px-2 py-1 rounded ${
                        u.active
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                      }`}
                    >
                      {u.active ? 'Active' : 'Disabled'}
                    </button>
                  </td>
                  <td className="px-6 py-3 text-slate-500">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
