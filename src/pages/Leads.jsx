import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import Badge from '../components/Badge.jsx';
import ChannelIcon from '../components/ChannelIcon.jsx';

const STATUSES = ['', 'NEW', 'CONTACTED', 'QUALIFIED', 'CONSULTATION', 'CONVERTED', 'CLOSED'];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const params = {};
      if (q) params.q = q;
      if (status) params.status = status;
      const data = await api.leads(params);
      setLeads(data);
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [status]);

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-4 border-b bg-white flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Leads</h1>
          <p className="text-sm text-slate-500">Every prospect across every channel.</p>
        </div>
        <div className="flex items-center gap-2">
          <form onSubmit={(e) => { e.preventDefault(); load(); }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone…"
              className="border rounded px-3 py-1.5 text-sm w-64"
            />
          </form>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s || 'All statuses'}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-white">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-6 py-3">Source</th>
                <th className="text-left px-6 py-3">Status</th>
                <th className="text-left px-6 py-3">Case Type</th>
                <th className="text-left px-6 py-3">Assigned</th>
                <th className="text-left px-6 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id} className="border-t hover:bg-slate-50">
                  <td className="px-6 py-3">
                    <Link to={`/leads/${l.id}`} className="font-medium hover:underline">
                      {l.fullName}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {l.email || l.phone || '—'}
                    </div>
                  </td>
                  <td className="px-6 py-3"><ChannelIcon channel={l.source} withLabel /></td>
                  <td className="px-6 py-3"><Badge status={l.status}>{l.status}</Badge></td>
                  <td className="px-6 py-3">{l.caseType ? l.caseType.name : '—'}</td>
                  <td className="px-6 py-3">{l.assignedTo ? l.assignedTo.name : '—'}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {new Date(l.updatedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">No leads.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
