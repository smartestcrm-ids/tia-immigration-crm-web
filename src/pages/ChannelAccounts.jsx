import { useEffect, useState } from 'react';
import { api } from '../api.js';

const CHANNELS = ['WHATSAPP', 'TELEGRAM', 'INSTAGRAM', 'EMAIL', 'SMS', 'WEB_FORM'];

const CHANNEL_HINT = {
  WHATSAPP: 'whatsapp:+14155238886',
  TELEGRAM: '@your_bot_name',
  INSTAGRAM: '@your_business_account',
  EMAIL:    'info@your-firm.com',
  SMS:      '+14385551020',
  WEB_FORM: 'website-form',
};

export default function ChannelAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [draft, setDraft] = useState({ channel: 'WHATSAPP', label: '', identifier: '' });
  const [error, setError] = useState(null);

  async function load() {
    setLoading(true);
    try { setAccounts(await api.channelAccounts()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    setError(null);
    try {
      await api.createChannelAccount(draft);
      setDraft({ channel: 'WHATSAPP', label: '', identifier: '' });
      setShowNew(false);
      await load();
    } catch (e) { setError(e.message); }
  }

  async function toggleActive(account) {
    await api.updateChannelAccount(account.id, { active: !account.active });
    load();
  }

  async function remove(account) {
    if (!confirm(`Delete channel account "${account.label}"?`)) return;
    try {
      await api.deleteChannelAccount(account.id);
      load();
    } catch (e) { setError(e.message); }
  }

  const grouped = accounts.reduce((acc, a) => {
    (acc[a.channel] = acc[a.channel] || []).push(a);
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Channel Accounts</h1>
          <p className="text-sm text-slate-500">
            Add multiple WhatsApp numbers, email inboxes, Telegram bots, Instagram pages, or SMS lines.
          </p>
        </div>
        <button
          onClick={() => setShowNew((s) => !s)}
          className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded hover:bg-brand-700"
        >
          {showNew ? 'Cancel' : '+ New account'}
        </button>
      </header>

      {showNew && (
        <form onSubmit={create} className="px-6 py-4 border-b bg-slate-50 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-600 mb-1">Channel</label>
            <select
              value={draft.channel}
              onChange={(e) => setDraft({ ...draft, channel: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
            >
              {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Label</label>
            <input
              required
              value={draft.label}
              onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm"
              placeholder="e.g. Toronto WhatsApp"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-600 mb-1">Identifier</label>
            <input
              required
              value={draft.identifier}
              onChange={(e) => setDraft({ ...draft, identifier: e.target.value })}
              className="w-full border rounded px-2 py-1.5 text-sm font-mono"
              placeholder={CHANNEL_HINT[draft.channel]}
            />
          </div>
          <button className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm">Create</button>
          {error && (
            <div className="md:col-span-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
              {error}
            </div>
          )}
        </form>
      )}

      <div className="flex-1 overflow-auto p-6 space-y-6">
        {loading && <p className="text-slate-500">Loading...</p>}
        {!loading && Object.keys(grouped).length === 0 && (
          <p className="text-slate-500">No channel accounts yet.</p>
        )}
        {!loading && Object.entries(grouped).map(([channel, list]) => (
          <section key={channel} className="bg-white rounded-lg border shadow-sm">
            <div className="px-5 py-3 border-b bg-slate-50 font-semibold text-sm uppercase tracking-wide">
              {channel} <span className="text-slate-400 font-normal">({list.length})</span>
            </div>
            <ul className="divide-y">
              {list.map((a) => (
                <li key={a.id} className="px-5 py-3 flex items-center gap-4">
                  <div className="flex-1">
                    <div className="font-medium">{a.label}</div>
                    <div className="text-xs font-mono text-slate-500">{a.identifier}</div>
                  </div>
                  <button
                    onClick={() => toggleActive(a)}
                    className={`text-xs px-2 py-1 rounded ${
                      a.active ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    }`}
                  >
                    {a.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => remove(a)}
                    className="text-xs px-2 py-1 rounded border border-red-300 text-red-600 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
