import { useEffect, useState } from 'react';
import { api } from '../api.js';

const REQ_STATUSES = ['PENDING', 'REQUESTED', 'RECEIVED', 'MISSING', 'NA'];
const REQ_STATUS_STYLE = {
  PENDING:   'bg-slate-100 text-slate-700',
  REQUESTED: 'bg-blue-100 text-blue-700',
  RECEIVED:  'bg-emerald-100 text-emerald-700',
  MISSING:   'bg-amber-100 text-amber-700',
  NA:        'bg-slate-100 text-slate-500 line-through',
};

export default function CasePipeline({ leadId }) {
  const [caseData, setCaseData] = useState(null);
  const [stages, setStages] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [newReqName, setNewReqName] = useState('');

  async function load() {
    setLoading(true);
    try {
      const [c, s, u] = await Promise.all([
        api.caseForLead(leadId),
        api.caseStages(),
        api.users(),
      ]);
      setCaseData(c);
      setStages(s);
      setUsers(u);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [leadId]);

  async function openCase() {
    setBusy(true);
    try {
      await api.createCase(leadId);
      await load();
    } finally { setBusy(false); }
  }

  async function updateCase(patch) {
    setBusy(true);
    try {
      await api.updateCase(caseData.id, patch);
      await load();
    } finally { setBusy(false); }
  }

  async function advanceStage() {
    setBusy(true);
    try {
      await api.advanceCase(caseData.id, {});
      await load();
    } finally { setBusy(false); }
  }

  async function updateRequirement(reqId, patch) {
    await api.updateRequirement(caseData.id, reqId, patch);
    await load();
  }

  async function addRequirement(e) {
    e.preventDefault();
    if (!newReqName.trim()) return;
    await api.addRequirement(caseData.id, { name: newReqName.trim() });
    setNewReqName('');
    await load();
  }

  async function deleteRequirement(reqId) {
    if (!confirm('Remove this checklist item?')) return;
    await api.deleteRequirement(caseData.id, reqId);
    await load();
  }

  if (loading) return <p className="text-sm text-slate-500">Loading case…</p>;

  // No case yet — offer to open one
  if (!caseData) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-slate-500 mb-3">
          This client doesn't have an active case file yet.
        </p>
        <button
          onClick={openCase}
          disabled={busy}
          className="px-4 py-2 bg-brand-600 text-white text-sm rounded hover:bg-brand-700 disabled:opacity-50"
        >
          {busy ? 'Opening…' : 'Open Case'}
        </button>
      </div>
    );
  }

  const currentIdx = stages.findIndex((s) => s.code === caseData.currentStage);
  const completedStageCodes = new Set(
    caseData.stageHistory.filter((e) => e.status === 'COMPLETED').map((e) => e.stage)
  );
  const balance =
    caseData.agreementAmount != null && caseData.amountPaid != null
      ? Number(caseData.agreementAmount) - Number(caseData.amountPaid)
      : null;

  return (
    <div className="space-y-5">
      {/* --- Case summary --- */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <SummaryCard label="Case #" value={caseData.id} />
        <SummaryCard label="Status" value={caseData.status} />
        <SummaryCard
          label="Case manager"
          value={
            <select
              value={caseData.caseManagerId || ''}
              onChange={(e) =>
                updateCase({ caseManagerId: e.target.value ? Number(e.target.value) : null })
              }
              className="text-sm border rounded px-1.5 py-0.5"
            >
              <option value="">— unassigned —</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          }
        />
        <SummaryCard
          label="Case type"
          value={caseData.caseType ? caseData.caseType.name : '—'}
        />
      </div>

      {/* --- Financials --- */}
      <div className="bg-slate-50 border rounded p-3">
        <h3 className="font-semibold text-sm mb-2">Financials</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <MoneyField
            label="Agreement"
            value={caseData.agreementAmount}
            currency={caseData.currency}
            onChange={(v) => updateCase({ agreementAmount: v })}
          />
          <MoneyField
            label="Paid"
            value={caseData.amountPaid}
            currency={caseData.currency}
            onChange={(v) => updateCase({ amountPaid: v })}
          />
          <div>
            <label className="block text-xs text-slate-500 mb-1">Balance</label>
            <div className="px-2 py-1.5 text-sm font-medium">
              {balance != null ? `${caseData.currency} ${balance.toFixed(2)}` : '—'}
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Agreement date</label>
            <input
              type="date"
              value={caseData.agreementDate ? caseData.agreementDate.slice(0, 10) : ''}
              onChange={(e) => updateCase({ agreementDate: e.target.value || null })}
              className="w-full border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>
      </div>

      {/* --- Stage timeline --- */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">
            Pipeline ({completedStageCodes.size} of {stages.length} completed)
          </h3>
          {caseData.currentStage !== 'DECISION_RECEIVED' && (
            <button
              onClick={advanceStage}
              disabled={busy}
              className="px-3 py-1 bg-brand-600 text-white text-xs rounded hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? 'Advancing…' : `Mark "${stages[currentIdx]?.label}" done →`}
            </button>
          )}
        </div>
        <ol className="space-y-1">
          {stages.map((s, i) => {
            const done = completedStageCodes.has(s.code);
            const isCurrent = s.code === caseData.currentStage;
            return (
              <li
                key={s.code}
                className={`flex items-center gap-3 py-1.5 px-2 rounded text-sm ${
                  isCurrent ? 'bg-brand-50 border border-brand-200 font-medium' : ''
                }`}
              >
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    done
                      ? 'bg-emerald-500 text-white'
                      : isCurrent
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {done ? '✓' : i + 1}
                </span>
                <span className={done ? 'line-through text-slate-500' : ''}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* --- Document checklist --- */}
      <div>
        <h3 className="font-semibold text-sm mb-2">
          Document checklist ({caseData.requirements.filter((r) => r.status === 'RECEIVED').length}
          {' '}of {caseData.requirements.length} received)
        </h3>
        <ul className="space-y-1.5">
          {caseData.requirements.map((r) => (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <select
                value={r.status}
                onChange={(e) => updateRequirement(r.id, { status: e.target.value })}
                className={`text-xs px-2 py-0.5 rounded border-0 focus:ring-1 focus:ring-brand-500 ${REQ_STATUS_STYLE[r.status] || ''}`}
              >
                {REQ_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <span className={r.status === 'NA' ? 'line-through text-slate-400' : ''}>
                {r.name}
              </span>
              {r.category && (
                <span className="text-xs text-slate-400">· {r.category}</span>
              )}
              <button
                onClick={() => deleteRequirement(r.id)}
                className="ml-auto text-xs text-slate-400 hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
        <form onSubmit={addRequirement} className="mt-3 flex gap-2">
          <input
            value={newReqName}
            onChange={(e) => setNewReqName(e.target.value)}
            placeholder="Add checklist item…"
            className="flex-1 border rounded px-3 py-1 text-sm"
          />
          <button className="px-3 py-1 bg-slate-800 text-white text-sm rounded hover:bg-slate-900">
            Add
          </button>
        </form>
      </div>

      {/* --- Notes --- */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">Case notes</label>
        <textarea
          value={caseData.notes || ''}
          onChange={(e) => setCaseData({ ...caseData, notes: e.target.value })}
          onBlur={(e) => updateCase({ notes: e.target.value })}
          rows={2}
          className="w-full border rounded px-2 py-1.5 text-sm"
          placeholder="Free-form notes about this case…"
        />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="bg-white border rounded p-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-0.5">{value}</div>
    </div>
  );
}

function MoneyField({ label, value, currency, onChange }) {
  const [local, setLocal] = useState(value != null ? String(value) : '');
  useEffect(() => { setLocal(value != null ? String(value) : ''); }, [value]);
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1">{label} ({currency})</label>
      <input
        type="number"
        min="0"
        step="0.01"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => onChange(local === '' ? null : Number(local))}
        className="w-full border rounded px-2 py-1 text-sm"
      />
    </div>
  );
}
