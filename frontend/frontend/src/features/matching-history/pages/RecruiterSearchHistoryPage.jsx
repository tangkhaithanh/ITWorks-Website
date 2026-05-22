import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, History, Loader2, RefreshCw } from "lucide-react";

import Button from "@/components/ui/Button";
import MatchingHistoryAPI from "@/features/matching-history/MatchingHistoryAPI";
import MatchingHistoryList from "@/features/matching-history/components/MatchingHistoryList";
import SavedMatchingSessionDetail from "@/features/matching-history/components/SavedMatchingSessionDetail";

const unwrapData = (response) => response?.data?.data ?? response?.data ?? null;

export default function RecruiterSearchHistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [detailError, setDetailError] = useState("");

  const loadSummaries = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await MatchingHistoryAPI.getSummaries();
      const nextSessions = unwrapData(response);
      setSessions(Array.isArray(nextSessions) ? nextSessions : []);
    } catch {
      setError("Khong the tai lich su matching. Hay thu lai.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id) => {
    try {
      setSelectedId(id);
      setDetailLoading(true);
      setDetailError("");
      const response = await MatchingHistoryAPI.getSession(id);
      setSelectedSession(unwrapData(response));
    } catch {
      setSelectedSession(null);
      setDetailError("Khong the tai response da luu cho phien nay.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  useEffect(() => {
    if (!selectedId && sessions.length > 0) {
      loadDetail(sessions[0].id);
    }
  }, [loadDetail, selectedId, sessions]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lich su tim kiem ung vien
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Luu lai ket qua Rank Applicants va Find Talent theo tung phien matching.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={loadSummaries} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Tai lai
        </Button>
      </header>

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center text-blue-600">
          <Loader2 className="h-9 w-9 animate-spin" />
        </div>
      ) : error ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-9 w-9 text-rose-500" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Khong tai duoc lich su
          </h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </section>
      ) : sessions.length === 0 ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <History className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Chua co phien matching da luu
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Chay Rank Applicants hoac Find Talent de tao lich su tim kiem ung vien.
          </p>
        </section>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]">
          <MatchingHistoryList
            sessions={sessions}
            selectedId={selectedId}
            onSelect={loadDetail}
          />
          <section className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
            <SavedMatchingSessionDetail
              session={selectedSession}
              loading={detailLoading}
              error={detailError}
            />
          </section>
        </div>
      )}
    </div>
  );
}
