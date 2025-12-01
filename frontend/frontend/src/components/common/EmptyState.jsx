// src/components/common/EmptyState.jsx

export default function EmptyState({ text = "Chưa có dữ liệu", className = "" }) {
  return (
    <div
      className={`flex items-center justify-center py-5 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300 ${className}`}
    >
      <p className="text-sm text-slate-400 italic">{text}</p>
    </div>
  );
}
