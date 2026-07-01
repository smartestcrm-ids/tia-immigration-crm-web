import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';

export default function Clients() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // Fetch converted leads + their cases in parallel.
        const [leads, cases] = await Promise.all([
          api.leads({ status: 'CONVERTED' }),
          api.cases(),
        ]);
        const caseByLeadId = Object.fromEntries((cases || []).map((c) => [c.lead.id, c]));
        setRows(leads.map((lead) => ({ lead, case: caseByLeadId[lead.id] })));
      } finally { setLoading(false); }
    })();
  }, []);

  const filtered = rows.filter(({ lead }) =>
    !q.trim() ||
    lead.fullName?.toLowerCase().includes(q.toLowerCase()) ||
    lead.email?.toLowerCase().includes(q.toLowerCase()) ||
    lead.phone?.includes(q)
  );

  const totalAgreement = rows.reduce((sum, r) => sum + (Number(r.case?.agreementAmount) || 0), 0);
  const totalPaid      = rows.reduce((sum, r) => sum + (Number(r.case?.amountPaid) || 0), 0);
  const totalBalance   = totalAgreement - totalPaid;

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Clients</h1>
            <p className="text-sm text-slate-500">Converted leads with active case files.</p>
          </div>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search name, email, phone…"
            className="border rounded px-3 py-1.5 text-sm w-72"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <Kpi label="Total clients"     value={rows.length} />
          <Kpi label="Total agreement"   value={`$${totalAgreement.toLocaleString()}`} />
          <Kpi label="Total collected"   value={`$${totalPaid.toLocaleString()}`} />
          <Kpi label="Balance owed"      value={`$${totalBalance.toLocaleString()}`} accent={totalBalance > 0 ? 'amber' : 'emerald'} />
        </div>
      </header>

      <div className="flex-1 overflow-auto bg-white">
        {loading ? (
          <p className="p-6 text-slate-500">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="p-6 text-slate-500">No clients yet. When a lead is moved to CONVERTED it appears here with an auto-opened case.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-6 py-3">Name</th>
                <th className="text-left px-4 py-3">Case type</th>
                <th className="text-left px-4 py-3">Current stage</th>
                <th className="text-right px-4 py-3">Agreement</th>
                <th className="text-right px-4 py-3">Paid</th>
                <th className="text-right px-4 py-3">Balance</th>
                <th className="text-left px-4 py-3">Case manager</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ lead, case: c }) => {
                const agreement = Number(c?.agreementAmount) || 0;
                const paid      = Number(c?.amountPaid) || 0;
                const balance   = agreement - paid;
                return (
                  <tr key={lead.id} className="border-t hover:bg-slate-50">
                    <td className="px-6 py-3">
                      <Link to={`/leads/${lead.id}`} className="font-medium text-brand-700 hover:underline">
                        {lead.fullName}
                      </Link>
                      <div className="text-xs text-slate-500">{lead.email || lead.phone || '—'}</div>
                    </td>
                    <td className="px-4 py-3">{c?.caseType?.name || lead.caseType?.name || '—'}</td>
                    <td className="px-4 py-3">
                      {c ? (
                        <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded">
                          {c.currentStage}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">no case</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">${agreement.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">${paid.toLocaleString()}</td>
                    <td className={`px-4 py-3 text-right font-medium ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
                      ${balance.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {c?.caseManager?.name || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }) {
  const accentClass = accent === 'amber' ? 'text-amber-700' : accent === 'emerald' ? 'text-emerald-700' : 'text-slate-900';
  return (
    <div className="bg-white border rounded p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-lg font-semibold ${accentClass}`}>{value}</div>
    </div>
  );
}
