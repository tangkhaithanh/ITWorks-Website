// src/components/common/TagList.jsx

export default function TagList({ items = [], color = "blue", className = "" }) {
  const styles = {
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    slate: "bg-slate-100 text-slate-700 border-slate-300",
  };

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.length > 0 ? (
        items.map((item, i) => (
          <span
            key={i}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${styles[color]}`}
          >
            {item}
          </span>
        ))
      ) : (
        <span className="text-sm text-slate-500 italic">Không có dữ liệu</span>
      )}
    </div>
  );
}
