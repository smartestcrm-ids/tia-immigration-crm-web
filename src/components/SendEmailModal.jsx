import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function SendEmailModal({ leadId, defaultTo, onClose, onSent }) {
  const [status, setStatus] = useState(null);      // { configured, fromEmail, fromName }
  const [to, setTo] = useState(defaultTo || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [files, setFiles] = useState([]);          // File objects from <input type=file>
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { api.messagingStatus().then(setStatus).catch(() => {}); }, []);

  async function submit(e) {
    e.preventDefault();
    setError(null);
    if (!to.trim()) { setError('Recipient email is required.'); return; }
    if (!subject.trim() || !body.trim()) { setError('Subject and body are required.'); return; }

    setSending(true);
    try {
      // Read file(s) as base64.
      const attachments = await Promise.all(
        files.map((f) =>
          fileToBase64(f).then((base64) => ({
            filename: f.name,
            contentBase64: base64,
            contentType: f.type || 'application/octet-stream',
          }))
        )
      );

      await api.sendEmail({
        leadId, to: to.trim(), subject, body,
        attachments: attachments.length ? attachments : undefined,
      });
      if (onSent) onSent();
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Send Email</h2>
            {status?.fromEmail && (
              <p className="text-xs text-slate-500">
                From: {status.fromName ? `${status.fromName} <${status.fromEmail}>` : status.fromEmail}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">✕</button>
        </div>

        {status && !status.configured ? (
          <div className="p-5 text-sm text-red-700 bg-red-50 border-t border-red-200">
            SMTP is not configured yet. Set <code>SMTP_HOST</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code> in the backend env vars, then redeploy.
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">To</label>
              <input
                type="email" required
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Subject</label>
              <input
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Message</label>
              <textarea
                required rows={8}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">
                Attachments{files.length > 0 && ` (${files.length})`}
              </label>
              <input
                type="file" multiple
                onChange={(e) => setFiles(Array.from(e.target.files || []))}
                className="text-xs"
              />
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={onClose} className="px-3 py-2 text-sm rounded border">
                Cancel
              </button>
              <button
                type="submit" disabled={sending}
                className="px-4 py-2 text-sm bg-brand-600 text-white rounded hover:bg-brand-700 disabled:opacity-50"
              >
                {sending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      // strip "data:...;base64," prefix
      const base64 = String(dataUrl).split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
