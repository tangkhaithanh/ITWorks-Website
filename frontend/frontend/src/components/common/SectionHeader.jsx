// src/components/common/SectionHeader.jsx

export default function SectionHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-6 border-b border-slate-200 bg-gradient-to-r from-slate-50/50 to-white">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>

      {/* Actions (buttons) */}
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
