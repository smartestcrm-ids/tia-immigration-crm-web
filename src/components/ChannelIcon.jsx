const CHANNEL_META = {
  WHATSAPP:  { label: 'WhatsApp',  emoji: '🟢', color: 'bg-green-100 text-green-800' },
  TELEGRAM:  { label: 'Telegram',  emoji: '✈️', color: 'bg-sky-100 text-sky-800' },
  INSTAGRAM: { label: 'Instagram', emoji: '📸', color: 'bg-pink-100 text-pink-800' },
  EMAIL:     { label: 'Email',     emoji: '✉️', color: 'bg-slate-100 text-slate-800' },
  WEB_FORM:  { label: 'Web form',  emoji: '🌐', color: 'bg-indigo-100 text-indigo-800' },
  SMS:       { label: 'SMS',       emoji: '💬', color: 'bg-yellow-100 text-yellow-800' },
};

export default function ChannelIcon({ channel, withLabel = false }) {
  const meta = CHANNEL_META[channel] || { label: channel, emoji: '•', color: 'bg-slate-100' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${meta.color}`}>
      <span>{meta.emoji}</span>
      {withLabel && <span>{meta.label}</span>}
    </span>
  );
}
