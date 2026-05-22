import { useCallback, useEffect, useState } from "react";
import { Heart, RefreshCw } from "lucide-react";

import CandidateAPI from "@/features/candidates/CandidateAPI";
import JobCard from "@/features/jobs/components/JobCard";

const SavedJobsSkeleton = () => (
  <div className="grid gap-4 lg:grid-cols-2">
    {[0, 1, 2, 3].map((item) => (
      <div
        key={item}
        className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
      >
        <div className="flex gap-4">
          <div className="h-16 w-16 rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-2/3 rounded bg-slate-100" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
            <div className="mt-6 flex gap-2">
              <div className="h-7 w-24 rounded bg-slate-100" />
              <div className="h-7 w-20 rounded bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const EmptySavedJobs = () => (
  <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-rose-500">
      <Heart className="h-8 w-8" />
    </div>
    <h2 className="mt-5 text-xl font-bold text-slate-900">
      Chưa có công việc đã lưu
    </h2>
    <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
      Những tin tuyển dụng bạn lưu sẽ xuất hiện ở đây để xem lại nhanh hơn.
    </p>
  </section>
);

export default function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSavedJobs = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await CandidateAPI.getSavedJobs();
      setSavedJobs(response.data?.data || []);
    } catch (err) {
      console.error("Không thể tải công việc đã lưu:", err);
      setError("Không thể tải danh sách công việc đã lưu.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedJobs();
  }, [fetchSavedJobs]);

  const handleToggleSave = (jobId, isNowSaved) => {
    if (!isNowSaved) {
      setSavedJobs((current) =>
        current.filter((savedJob) => savedJob.job?.id !== jobId)
      );
    }
  };

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-6">
          <p className="text-sm font-semibold text-rose-600">Ứng viên</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Công việc đã lưu
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Xem lại các tin tuyển dụng bạn muốn theo dõi.
          </p>
        </header>

        {loading && <SavedJobsSkeleton />}

        {!loading && error && (
          <section className="rounded-xl border border-rose-200 bg-white px-6 py-10 text-center">
            <h2 className="text-lg font-bold text-slate-900">
              Tải danh sách thất bại
            </h2>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={fetchSavedJobs}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </section>
        )}

        {!loading && !error && savedJobs.length === 0 && <EmptySavedJobs />}

        {!loading && !error && savedJobs.length > 0 && (
          <section className="grid gap-4 lg:grid-cols-2">
            {savedJobs.map((savedJob) => (
              <JobCard
                key={savedJob.id}
                job={savedJob.job}
                isSaved
                onToggleSave={handleToggleSave}
              />
            ))}
          </section>
        )}
      </div>
    </main>
  );
}
