export default function EmptyState({ title, hint }) {
  return (
    <div className="border border-dashed border-slate-300 rounded-xl py-12 text-center bg-white">
      <div className="text-slate-700 font-medium">{title}</div>
      {hint && <div className="text-sm text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}
