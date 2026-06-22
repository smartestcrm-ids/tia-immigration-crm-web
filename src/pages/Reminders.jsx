import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Reminders() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Aggregates reminders across all leads (simple Phase 1 approach: walk leads).
  async function load() {
    setLoading(true);
    try {
      const leads = await api.leads({ take: 200 });
      const all = [];
      for (const lead of leads) {
        const reminders = await api.reminders(lead.id);
        for (const r of reminders) {
          all.push({ ...r, lead });
        }
      }
      all.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
      setItems(all);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function toggle(r) {
    await api.updateReminder(r.lead.id, r.id, { completed: !r.completed });
    load();
  }

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Reminders</h1>
        <p className="text-sm text-slate-500">All open follow-ups across every lead.</p>
      </header>

      <div className="flex-1 overflow-auto bg-white">
        {loading && <p className="p-6 text-slate-500">Loading…</p>}
        {!loading && items.length === 0 && (
          <p className="p-6 text-slate-500">No reminders yet.</p>
        )}
        <ul className="divide-y">
          {items.map((r) => (
            <li key={r.id} className="px-6 py-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={r.completed}
                onChange={() => toggle(r)}
              />
              <div className="flex-1">
                <div className={`text-sm ${r.completed ? 'line-through text-slate-400' : ''}`}>
                  {r.title}
                </div>
                <Link to={`/leads/${r.lead.id}`} className="text-xs text-slate-500 hover:underline">
                  {r.lead.fullName}
                </Link>
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                {new Date(r.dueAt).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
