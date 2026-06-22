const STATUS_STYLES = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-amber-100 text-amber-800',
  QUALIFIED: 'bg-purple-100 text-purple-800',
  CONSULTATION: 'bg-indigo-100 text-indigo-800',
  CONVERTED: 'bg-emerald-100 text-emerald-800',
  CLOSED: 'bg-slate-200 text-slate-700',
};

export default function Badge({ children, status, className = '' }) {
  const tone = status ? STATUS_STYLES[status] || 'bg-slate-100 text-slate-700' : 'bg-slate-100 text-slate-700';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tone} ${className}`}>
      {children}
    </span>
  );
}
