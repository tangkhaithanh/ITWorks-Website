export default function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 h-5 w-2/3 rounded bg-slate-200" />
      <div className="space-y-3">
        <div className="h-4 w-1/2 rounded bg-slate-100" />
        <div className="h-4 w-1/3 rounded bg-slate-100" />
        <div className="h-4 w-2/3 rounded bg-slate-100" />
      </div>
      <div className="mt-5 h-10 w-40 rounded-2xl bg-slate-200" />
    </div>
  );
}
