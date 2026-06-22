import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import Badge from '../components/Badge.jsx';
import ChannelIcon from '../components/ChannelIcon.jsx';
import ClientProfileSection from '../components/ClientProfileSection.jsx';

const STATUSES = ['NEW', 'CONTACTED', 'QUALIFIED', 'CONSULTATION', 'CONVERTED', 'CLOSED'];

export default function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);
  const [caseTypes, setCaseTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [noteDraft, setNoteDraft] = useState('');
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDate, setReminderDate] = useState('');

  async function load() {
    const [l, ct, us] = await Promise.all([api.lead(id), api.caseTypes(), api.users()]);
    setLead(l);
    setCaseTypes(ct);
    setUsers(us);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function updateField(field, value) {
    await api.updateLead(id, { [field]: value });
    await load();
  }

  async function addNote(e) {
    e.preventDefault();
    if (!noteDraft.trim()) return;
    await api.addNote(id, noteDraft.trim());
    setNoteDraft('');
    await load();
  }

  async function addReminder(e) {
    e.preventDefault();
    if (!reminderTitle.trim() || !reminderDate) return;
    await api.addReminder(id, { title: reminderTitle.trim(), dueAt: new Date(reminderDate).toISOString() });
    setReminderTitle('');
    setReminderDate('');
    await load();
  }

  async function toggleReminder(reminder) {
    await api.updateReminder(id, reminder.id, { completed: !reminder.completed });
    await load();
  }

  if (!lead) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="h-full overflow-auto">
      <header className="px-6 py-4 border-b bg-white flex items-center gap-3">
        <Link to="/leads" className="text-sm text-slate-500 hover:underline">← Leads</Link>
        <h1 className="text-xl font-semibold">{lead.fullName}</h1>
        <ChannelIcon channel={lead.source} withLabel />
        <Badge status={lead.status}>{lead.status}</Badge>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
        {/* Profile */}
        <section className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-semibold mb-3">Profile</h2>
          <dl className="text-sm space-y-2">
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{lead.email || '—'}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Phone</dt><dd>{lead.phone || '—'}</dd></div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">Status</dt>
              <dd>
                <select
                  value={lead.status}
                  onChange={(e) => updateField('status', e.target.value)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">Case type</dt>
              <dd>
                <select
                  value={lead.caseTypeId || ''}
                  onChange={(e) => updateField('caseTypeId', e.target.value ? Number(e.target.value) : null)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="">—</option>
                  {caseTypes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-slate-500">Assigned</dt>
              <dd>
                <select
                  value={lead.assignedToId || ''}
                  onChange={(e) => updateField('assignedToId', e.target.value ? Number(e.target.value) : null)}
                  className="border rounded px-2 py-1 text-sm"
                >
                  <option value="">—</option>
                  {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
              </dd>
            </div>
          </dl>

          <h3 className="font-semibold mt-5 mb-2 text-sm">Conversations</h3>
          <ul className="space-y-1.5 text-sm">
            {lead.conversations.map((c) => (
              <li key={c.id}>
                <Link to={`/inbox/${c.id}`} className="flex items-center gap-2 hover:underline">
                  <ChannelIcon channel={c.channel} withLabel />
                  <span className="text-slate-500 text-xs">
                    {new Date(c.lastMessageAt).toLocaleString()}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-semibold mb-3">Notes</h2>
          <form onSubmit={addNote} className="mb-4 flex gap-2">
            <input
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              placeholder="Add a note…"
              className="flex-1 border rounded px-3 py-1.5 text-sm"
            />
            <button className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm hover:bg-brand-700">
              Add
            </button>
          </form>
          <ul className="space-y-3">
            {lead.notes.map((n) => (
              <li key={n.id} className="text-sm border-l-2 border-slate-200 pl-3">
                <p>{n.body}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {n.author ? n.author.name : 'Unknown'} · {new Date(n.createdAt).toLocaleString()}
                </p>
              </li>
            ))}
            {lead.notes.length === 0 && <p className="text-sm text-slate-500">No notes yet.</p>}
          </ul>
        </section>

        {/* Reminders */}
        <section className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="font-semibold mb-3">Reminders</h2>
          <form onSubmit={addReminder} className="mb-4 space-y-2">
            <input
              value={reminderTitle}
              onChange={(e) => setReminderTitle(e.target.value)}
              placeholder="Reminder title…"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
            <div className="flex gap-2">
              <input
                type="datetime-local"
                value={reminderDate}
                onChange={(e) => setReminderDate(e.target.value)}
                className="flex-1 border rounded px-3 py-1.5 text-sm"
              />
              <button className="px-3 py-1.5 bg-brand-600 text-white rounded text-sm hover:bg-brand-700">
                Add
              </button>
            </div>
          </form>
          <ul className="space-y-2">
            {lead.reminders.map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={r.completed}
                  onChange={() => toggleReminder(r)}
                />
                <span className={r.completed ? 'line-through text-slate-400' : ''}>
                  {r.title}
                </span>
                <span className="text-xs text-slate-400 ml-auto">
                  {new Date(r.dueAt).toLocaleString()}
                </span>
              </li>
            ))}
            {lead.reminders.length === 0 && <p className="text-sm text-slate-500">No reminders.</p>}
          </ul>
        </section>
      </div>

      {lead.status === 'CONVERTED' && (
        <div className="px-6 pb-8">
          <div className="border-t pt-6 mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              Client Profile
              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">CONVERTED</span>
            </h2>
            <p className="text-sm text-slate-500">Family members and documents for this client.</p>
          </div>
          <ClientProfileSection leadId={lead.id} />
        </div>
      )}
    </div>
  );
}
