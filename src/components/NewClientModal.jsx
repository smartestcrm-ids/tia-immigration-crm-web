import { useEffect, useState } from 'react';
import { api } from '../api.js';

const CHANNELS = ['WEB_FORM', 'WHATSAPP', 'EMAIL', 'TELEGRAM', 'INSTAGRAM', 'SMS'];

export default function NewClientModal({ onClose, onCreated }) {
  const [caseTypes, setCaseTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    caseTypeId: '',
    assignedToId: '',
    source: 'WEB_FORM',
    agreementAmount: '',
    amountPaid: '',
    agreementDate: '',
    currency: 'CAD',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.caseTypes(), api.users()])
      .then(([cts, us]) => { setCaseTypes(cts); setUsers(us); })
      .catch(() => {});
  }, []);

  function set(field, value) { setForm({ ...form, [field]: value }); }

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!form.fullName.trim()) { setError('Name is required.'); return; }
    if (!form.email && !form.phone) { setError('Provide at least an email or a phone number.'); return; }

    setSubmitting(true);
    try {
      const body = {
        fullName: form.fullName.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        source: form.source,
        status: 'CONVERTED', // clients are converted leads
        caseTypeId: form.caseTypeId ? Number(form.caseTypeId) : null,
        assignedToId: form.assignedToId ? Number(form.assignedToId) : null,
        currency: form.currency || 'CAD',
      };
      if (form.agreementAmount !== '') body.agreementAmount = Number(form.agreementAmount);
      if (form.amountPaid !== '')      body.amountPaid      = Number(form.amountPaid);
      if (form.agreementDate)          body.agreementDate   = form.agreementDate;

      const created = await api.createLead(body);
      if (onCreated) onCreated(created);
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to create client.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-semibold">New Client</h2>
            <p className="text-xs text-slate-500">Creates a CONVERTED lead with an active case file.</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {/* --- Person --- */}
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Contact
            </legend>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Full name *</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => set('fullName', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
                placeholder="e.g. Ali Rezaei"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set('email', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="client@example.com"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="+14161234567"
                />
              </div>
            </div>
          </fieldset>

          {/* --- Case --- */}
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Case
            </legend>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Case type</label>
                <select
                  value={form.caseTypeId}
                  onChange={(e) => set('caseTypeId', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">— select —</option>
                  {caseTypes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Case manager</label>
                <select
                  value={form.assignedToId}
                  onChange={(e) => set('assignedToId', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="">— unassigned —</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Original source</label>
              <select
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                {CHANNELS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">How this client first reached the office.</p>
            </div>
          </fieldset>

          {/* --- Financials --- */}
          <fieldset className="space-y-3">
            <legend className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">
              Financials
            </legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-600 mb-1">Agreement</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.agreementAmount}
                  onChange={(e) => set('agreementAmount', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Paid</label>
                <input
                  type="number" min="0" step="0.01"
                  value={form.amountPaid}
                  onChange={(e) => set('amountPaid', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Currency</label>
                <select
                  value={form.currency}
                  onChange={(e) => set('currency', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                >
                  <option value="CAD">CAD</option>
                  <option value="USD">USD</option>
                  <option value="AED">AED</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">Agreement date</label>
                <input
                  type="date"
                  value={form.agreementDate}
                  onChange={(e) => set('agreementDate', e.target.value)}
                  className="w-full border rounded px-3 py-2 text-sm"
                />
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Balance is calculated automatically as Agreement − Paid.
            </p>
          </fieldset>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded px-3 py-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">
              Cancel
            </button>
            <button
              type="submit" disabled={submitting}
              className="px-4 py-2 text-sm bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
            >
              {submitting ? 'Creating…' : 'Create client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
