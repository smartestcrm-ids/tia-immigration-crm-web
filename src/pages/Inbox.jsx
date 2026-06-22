import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import ChannelIcon from '../components/ChannelIcon.jsx';
import Badge from '../components/Badge.jsx';

const CHANNELS = ['', 'WHATSAPP', 'TELEGRAM', 'INSTAGRAM', 'EMAIL', 'WEB_FORM', 'SMS'];

export default function Inbox() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channel, setChannel] = useState('');

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.inbox(channel ? { channel } : {});
      setItems(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [channel]);

  return (
    <div className="h-full flex flex-col">
      <header className="px-6 py-4 border-b bg-white flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Inbox</h1>
          <p className="text-sm text-slate-500">All messages from every channel, latest first.</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="border rounded px-3 py-1.5 text-sm"
          >
            {CHANNELS.map((c) => (
              <option key={c} value={c}>{c || 'All channels'}</option>
            ))}
          </select>
          <button
            onClick={load}
            className="px-3 py-1.5 text-sm border rounded hover:bg-slate-50"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto">
        {loading && <p className="p-6 text-slate-500">Loading…</p>}
        {error && <p className="p-6 text-red-600">Error: {error}</p>}
        {!loading && !error && items.length === 0 && (
          <p className="p-6 text-slate-500">No conversations.</p>
        )}
        <ul className="divide-y bg-white">
          {items.map((item) => (
            <li
              key={item.id}
              onClick={() => navigate(`/inbox/${item.id}`)}
              className="px-6 py-4 hover:bg-slate-50 cursor-pointer flex items-center gap-4"
            >
              <ChannelIcon channel={item.channel} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{item.leadName}</span>
                  <Badge status={item.leadStatus}>{item.leadStatus}</Badge>
                  {item.caseType && (
                    <span className="text-xs text-slate-500">· {item.caseType}</span>
                  )}
                  {item.unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-brand-600 text-white text-xs">
                      {item.unreadCount}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-600 truncate mt-0.5">
                  {item.direction === 'OUT' && <span className="text-slate-400">You: </span>}
                  {item.preview || <em className="text-slate-400">No messages</em>}
                </p>
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap">
                {item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleString() : ''}
              </div>
              {item.assignedTo && (
                <div className="text-xs text-slate-500 hidden md:block">
                  → {item.assignedTo.name}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
