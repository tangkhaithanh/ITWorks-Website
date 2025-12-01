// src/components/common/Card.jsx

export function Card({ children, className = "" }) {
  return (
    <div
      className={`bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 overflow-visible ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ icon, title, className = "" }) {
  return (
    <div
      className={`px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white ${className}`}
    >
      <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
        {icon && <span className="text-lg">{icon}</span>}
        {title}
      </h2>
    </div>
  );
}

export function CardBody({ children, className = "" }) {
  return <div className={`p-6 bg-white ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
  return (
    <div className={`px-6 py-4 border-t border-slate-200 bg-slate-50 ${className}`}>
      {children}
    </div>
  );
}
