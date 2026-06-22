import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function Roles() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [draftKeys, setDraftKeys] = useState(new Set());
  const [showNewForm, setShowNewForm] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '' });
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [r, p] = await Promise.all([api.roles(), api.permissions()]);
      setRoles(r);
      setPermissions(p);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const permByCategory = permissions.reduce((acc, p) => {
    (acc[p.category] = acc[p.category] || []).push(p);
    return acc;
  }, {});

  function startEdit(role) {
    setEditingId(role.id);
    setDraftKeys(new Set(role.permissionKeys));
    setError(null);
  }

  function toggleKey(key) {
    const next = new Set(draftKeys);
    if (next.has(key)) next.delete(key); else next.add(key);
    setDraftKeys(next);
  }

  async function saveEdit() {
    setError(null);
    try {
      const permissionIds = permissions.filter((p) => draftKeys.has(p.key)).map((p) => p.id);
      await api.updateRole(editingId, { permissionIds });
      setEditingId(null);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function createRole(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createRole({ name: newRole.name, description: newRole.description, permissionIds: [] });
      setNewRole({ name: '', description: '' });
      setShowNewForm(false);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function deleteRole(role) {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    setError(null);
    try {
      await api.deleteRole(role.id);
      await load();
    } catch (e) { setError(e.message); }
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Roles & Permissions</h1>
          <p className="text-sm text-slate-500">Create custom roles and pick exactly which actions each one can do.</p>
        </div>
        <button
          onClick={() => setShowNewForm((s) => !s)}
          className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded hover:bg-brand-700"
        >
          {showNewForm ? 'Cancel' : '+ New role'}
        </button>
      </header>

      {showNewForm && (
        <form onSubmit={createRole} className="px-6 py-4 border-b bg-slate-50 flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-slate-600 mb-1">Role name</label>
            <input
              required
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="e.g. Senior Consultant"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-slate-600 mb-1">Description</label>
            <input
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="What can this role do?"
            />
          </div>
          <button className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm">Create</button>
        </form>
      )}

      {error && (
        <div className="mx-6 mt-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
          {error}
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {loading && <p className="text-slate-500">Loading...</p>}
        {!loading && roles.map((role) => {
          const isEditing = editingId === role.id;
          return (
            <section key={role.id} className="bg-white rounded-lg border shadow-sm">
              <div className="px-5 py-4 border-b flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-lg">{role.name}</h2>
                    {role.isSystem && (
                      <span className="text-[10px] uppercase tracking-wide bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                        System
                      </span>
                    )}
                    <span className="text-xs text-slate-500">{role.userCount} user(s)</span>
                  </div>
                  {role.description && <p className="text-sm text-slate-500 mt-0.5">{role.description}</p>}
                </div>
                <div className="flex gap-2">
                  {!isEditing ? (
                    <>
                      <button
                        onClick={() => startEdit(role)}
                        className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
                      >
                        Edit permissions
                      </button>
                      {!role.isSystem && (
                        <button
                          onClick={() => deleteRole(role)}
                          className="px-3 py-1.5 text-sm border border-red-300 text-red-600 rounded hover:bg-red-50"
                        >
                          Delete
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1.5 text-sm bg-brand-600 text-white rounded hover:bg-brand-700"
                      >
                        Save
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {Object.entries(permByCategory).map(([cat, perms]) => (
                  <div key={cat}>
                    <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">{cat}</h3>
                    <ul className="space-y-1">
                      {perms.map((p) => {
                        const checked = isEditing
                          ? draftKeys.has(p.key)
                          : role.permissionKeys.includes(p.key);
                        return (
                          <li key={p.id} className="flex items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => isEditing && toggleKey(p.key)}
                              disabled={!isEditing}
                              className="mt-0.5"
                            />
                            <div>
                              <div className={checked ? 'text-slate-900' : 'text-slate-400'}>
                                {p.description}
                              </div>
                              <div className="text-[11px] font-mono text-slate-400">{p.key}</div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
