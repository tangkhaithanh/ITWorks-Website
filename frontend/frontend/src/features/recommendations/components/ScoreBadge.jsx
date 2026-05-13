const ScoreBadge = ({ score, label, size = "sm" }) => {
  const pct = Math.round(score * 100);
  const colorClass =
    pct >= 70
      ? "bg-green-100 text-green-800 border-green-300"
      : pct >= 40
        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
        : "bg-red-100 text-red-800 border-red-300";

  const sizeClass = size === "lg" ? "text-lg px-4 py-2" : "text-sm px-3 py-1";

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${colorClass} ${sizeClass}`}
      title={label}
    >
      {pct}%
    </span>
  );
};

export default ScoreBadge;
