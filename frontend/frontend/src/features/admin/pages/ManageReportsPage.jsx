import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Filter, Loader2, SearchX } from "lucide-react";
import ReportAdminAPI from "@/features/admin/ReportAdminAPI";

const STATUS_LABELS = {
  pending: "Chờ xử lý",
  under_review: "Đang xem xét",
  resolved: "Đã xử lý",
  dismissed: "Đã bỏ qua",
};

const TARGET_LABELS = {
  job: "Tin tuyển dụng",
  company: "Công ty",
};

export default function ManageReportsPage() {
  const [reports, setReports] = useState([]);
  const [status, setStatus] = useState("");
  const [targetType, setTargetType] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const limit = 10;

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await ReportAdminAPI.list({
          page,
          limit,
          ...(status ? { status } : {}),
          ...(targetType ? { targetType } : {}),
        });
        const data = res.data.data ?? res.data;
        setReports(data.items ?? []);
        setTotal(data.total ?? 0);
      } catch (err) {
        console.error("Cannot load reports", err);
        setError("Không thể tải danh sách báo cáo");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [page, status, targetType]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý báo cáo</h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi và xử lý báo cáo về tin tuyển dụng hoặc công ty.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <AlertTriangle className="h-4 w-4 text-amber-500" />
          {total} báo cáo
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Filter className="h-4 w-4" />
          Bộ lọc
        </div>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={targetType}
          onChange={(event) => {
            setTargetType(event.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Tất cả đối tượng</option>
          {Object.entries(TARGET_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" />
            Đang tải báo cáo...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-rose-600">{error}</div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-10 text-slate-500">
            <SearchX className="mb-3 h-10 w-10 text-slate-300" />
            Không có báo cáo phù hợp
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Đối tượng</th>
                  <th className="px-4 py-3">Người báo cáo</th>
                  <th className="px-4 py-3">Lý do</th>
                  <th className="px-4 py-3">Trạng thái</th>
                  <th className="px-4 py-3">Ngày gửi</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {report.targetTitle || "Không rõ"}
                      </div>
                      <div className="text-xs text-slate-500">
                        {TARGET_LABELS[report.targetType] || report.targetType}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {report.reporterName || report.reporterAccountId}
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-slate-600">
                      {report.reason}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {STATUS_LABELS[report.status] || report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(report.createdAt).toLocaleString("vi-VN")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/admin/reports/${report.id}`}
                        className="font-semibold text-blue-600 hover:text-blue-800"
                      >
                        Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((current) => Math.max(current - 1, 1))}
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
        >
          Trước
        </button>
        <span className="text-sm text-slate-500">
          Trang {page}/{totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() =>
            setPage((current) => Math.min(current + 1, totalPages))
          }
          className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 disabled:opacity-40"
        >
          Sau
        </button>
      </div>
    </div>
  );
}
