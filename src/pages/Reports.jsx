import { useEffect, useState } from 'react';
import { api, getToken } from '../api.js';

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try { setData(await api.reportSummary()); }
      catch (e) { setError(e.message); }
      finally { setLoading(false); }
    })();
  }, []);

  function downloadCsv(kind) {
    // We need the auth header, so we build a small download flow with fetch.
    const url = `/api/reports/${kind}.csv`;
    fetch(url, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${kind}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  }

  if (loading) return <div className="p-8 text-slate-500">Loading reports…</div>;
  if (error)   return <div className="p-8 text-red-600">Error: {error}</div>;

  const { totals, recent, revenue, breakdowns } = data;

  return (
    <div className="h-full overflow-auto bg-slate-50">
      <header className="px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-semibold">Reports</h1>
        <p className="text-sm text-slate-500">Office-wide summary. Download raw data as CSV below.</p>
      </header>

      <div className="p-6 space-y-6 max-w-7xl">

        {/* KPI row */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi label="Total leads (open)" value={totals.leads} />
          <Kpi label="Total clients"      value={totals.clients} />
          <Kpi label="Open cases"         value={totals.openCases} />
          <Kpi label="Conversion (this month)" value={pct(recent.conversionRate)} accent="brand" />
        </section>

        {/* Revenue row */}
        <section className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Revenue</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Kpi label="Agreements signed" value={money(revenue.agreement)} />
            <Kpi label="Collected"         value={money(revenue.paid)} accent="emerald" />
            <Kpi label="Outstanding balance" value={money(revenue.balance)} accent={revenue.balance > 0 ? 'amber' : 'emerald'} />
          </div>
        </section>

        {/* Recent activity */}
        <section className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Recent activity</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Kpi label="New leads (7 days)"  value={recent.newLast7d} />
            <Kpi label="New leads (30 days)" value={recent.newLast30d} />
            <Kpi label="New this month"      value={recent.newThisMonth} />
            <Kpi label="Converted this month" value={recent.convertedThisMonth} />
          </div>
        </section>

        {/* Breakdowns */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <BreakdownTable title="Leads by status"  data={breakdowns.leadsByStatus} />
          <BreakdownTable title="Cases by stage"   data={breakdowns.casesByStage} />
          <BreakdownTable title="Leads by source"  data={breakdowns.leadsBySource} />
        </section>

        {/* CSV downloads */}
        <section className="bg-white border rounded-lg p-4">
          <h2 className="font-semibold text-sm mb-3">Download raw data (CSV)</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => downloadCsv('leads')}   className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded hover:bg-brand-700">
              Download Leads
            </button>
            <button onClick={() => downloadCsv('clients')} className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded hover:bg-brand-700">
              Download Clients
            </button>
            <button onClick={() => downloadCsv('cases')}   className="px-3 py-1.5 bg-brand-600 text-white text-sm rounded hover:bg-brand-700">
              Download Cases
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">CSV files open directly in Excel / Google Sheets.</p>
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }) {
  const cls = accent === 'emerald' ? 'text-emerald-700'
            : accent === 'amber'   ? 'text-amber-700'
            : accent === 'brand'   ? 'text-brand-700'
            : 'text-slate-900';
  return (
    <div className="bg-white border rounded p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`text-2xl font-semibold ${cls}`}>{value}</div>
    </div>
  );
}

function BreakdownTable({ title, data }) {
  const entries = Object.entries(data || {}).sort((a, b) => b[1] - a[1]);
  const total   = entries.reduce((sum, [, n]) => sum + n, 0);
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-semibold text-sm mb-3">{title}</h3>
      {entries.length === 0 ? (
        <p className="text-xs text-slate-400">No data yet.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {entries.map(([k, n]) => (
            <li key={k} className="flex items-center gap-2">
              <span className="w-32 truncate text-slate-700">{k}</span>
              <div className="flex-1 bg-slate-100 rounded h-2 relative">
                <div
                  className="bg-brand-600 h-2 rounded"
                  style={{ width: `${total ? (n / total) * 100 : 0}%` }}
                />
              </div>
              <span className="text-xs text-slate-500 w-8 text-right">{n}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function pct(f) { return `${Math.round((f || 0) * 100)}%`; }
function money(n) { return `$${Number(n || 0).toLocaleString()}`; }
