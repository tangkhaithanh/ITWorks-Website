import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, History, Loader2 } from "lucide-react";

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
      setError("Không thể tải lịch sử tìm kiếm ứng viên. Hãy thử lại.");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDetail = useCallback(async (id) => {
    try {
      setSelectedId(id);
      setSelectedSession(null);
      setDetailLoading(true);
      setDetailError("");
      const response = await MatchingHistoryAPI.getSession(id);
      setSelectedSession(unwrapData(response));
    } catch {
      setSelectedSession(null);
      setDetailError("Không thể tải kết quả đã lưu của phiên này.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const closeDetail = () => {
    setSelectedId(null);
    setSelectedSession(null);
    setDetailError("");
    setDetailLoading(false);
  };

  useEffect(() => {
    loadSummaries();
  }, [loadSummaries]);

  return (
    <div className="space-y-6">
      <header>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lịch sử tìm kiếm ứng viên
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Lưu lại kết quả xếp hạng và tìm kiếm ứng viên theo từng phiên.
          </p>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center text-blue-600">
          <Loader2 className="h-9 w-9 animate-spin" />
        </div>
      ) : error ? (
        <section className="rounded-[1.5rem] border border-rose-200 bg-white p-8 text-center shadow-sm">
          <AlertTriangle className="mx-auto h-9 w-9 text-rose-500" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Không tải được lịch sử
          </h2>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </section>
      ) : sessions.length === 0 ? (
        <section className="rounded-[1.5rem] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
            <History className="h-7 w-7" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Chưa có phiên tìm kiếm đã lưu
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Chạy xếp hạng hoặc tìm kiếm ứng viên để tạo lịch sử.
          </p>
        </section>
      ) : (
        <div
          className={
            selectedId
              ? "grid items-stretch gap-5 2xl:grid-cols-[minmax(300px,0.42fr)_minmax(0,1fr)]"
              : "grid gap-5"
          }
        >
          <MatchingHistoryList
            sessions={sessions}
            selectedId={selectedId}
            onSelect={loadDetail}
          />
          {selectedId ? (
            <section className="min-w-0 min-h-[420px] h-[calc(100vh-11rem)] overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
              <SavedMatchingSessionDetail
                session={selectedSession}
                loading={detailLoading}
                error={detailError}
                onClose={closeDetail}
              />
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
