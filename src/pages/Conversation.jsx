import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import ChannelIcon from '../components/ChannelIcon.jsx';
import Badge from '../components/Badge.jsx';

export default function Conversation() {
  const { id } = useParams();
  const [conv, setConv] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  async function load() {
    try {
      const data = await api.conversation(id);
      setConv(data);
      // Mark conversation as read.
      api.markRead(id).catch(() => {});
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [conv]);

  async function send(e) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSending(true);
    try {
      await api.sendMessage(id, draft.trim());
      setDraft('');
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!conv) return <div className="p-6 text-slate-500">Loading…</div>;

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-3 border-b bg-white flex items-center gap-3">
        <Link to="/inbox" className="text-sm text-slate-500 hover:underline">← Inbox</Link>
        <ChannelIcon channel={conv.channel} withLabel />
        <Link to={`/leads/${conv.lead.id}`} className="font-medium hover:underline">
          {conv.lead.fullName}
        </Link>
        <Badge status={conv.lead.status}>{conv.lead.status}</Badge>
        {conv.lead.caseType && (
          <span className="text-sm text-slate-500">· {conv.lead.caseType.name}</span>
        )}
        {conv.lead.assignedTo && (
          <span className="ml-auto text-sm text-slate-500">
            Assigned to {conv.lead.assignedTo.name}
          </span>
        )}
      </header>

      <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-3 bg-slate-50">
        {conv.messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-xl rounded-lg px-4 py-2 ${
              m.direction === 'IN'
                ? 'bg-white shadow-sm self-start mr-auto'
                : 'bg-brand-600 text-white self-end ml-auto'
            }`}
          >
            <div className="text-sm whitespace-pre-wrap">{m.body}</div>
            <div className={`text-xs mt-1 ${m.direction === 'IN' ? 'text-slate-400' : 'text-brand-100'}`}>
              {new Date(m.sentAt).toLocaleString()}
            </div>
          </div>
        ))}
        {conv.messages.length === 0 && (
          <p className="text-slate-500">No messages yet.</p>
        )}
      </div>

      <form onSubmit={send} className="border-t bg-white p-3 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Reply via ${conv.channel.replace('_', ' ').toLowerCase()}...`}
          className="flex-1 border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          className="px-4 py-2 bg-brand-600 text-white rounded text-sm hover:bg-brand-700 disabled:opacity-50"
        >
          {sending ? 'Sending…' : 'Send'}
        </button>
      </form>
    </div>
  );
}
