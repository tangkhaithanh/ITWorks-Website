import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Button from "@/components/ui/Button";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import DatePickerInput from "@/components/ui/DatePickerInput";
import TextInput from "@/components/ui/TextInput";
import JobAPI from "@/features/jobs/JobAPI";
import SectionHeader from "@/components/common/SectionHeader";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LineChart,
  Line,
  Cell,
} from "recharts";

// =====================
// Helper: formatters
// =====================

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatShortDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  });
};

const formatDaysLeft = (days) => {
  if (days === null || days === undefined) return "—";
  if (days > 0) return `Còn ${days} ngày`;
  if (days === 0) return "Hết hạn hôm nay";
  return `Đã hết hạn ${Math.abs(days)} ngày`;
};

const applicationStatusMap = {
  pending: { 
    label: "Chờ xử lý", 
    color: "bg-slate-100 text-slate-700 border-slate-300" 
  },

  interviewing: { 
    label: "Phỏng vấn", 
    color: "bg-blue-50 text-blue-700 border-blue-200" 
  },

  accepted: { 
    label: "Đã nhận", 
    color: "bg-emerald-50 text-emerald-700 border-emerald-300" 
  },

  rejected: { 
    label: "Từ chối", 
    color: "bg-red-50 text-red-600 border-red-200" 
  },

  withdrawn: { 
    label: "Rút hồ sơ", 
    color: "bg-violet-50 text-violet-700 border-violet-200" 
  },
};


const jobStatusMap = {
  active: { label: "Đang hiển thị", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  hidden: { label: "Đang ẩn", color: "bg-slate-100 text-slate-700 border-slate-300" },
  expired: { label: "Hết hạn", color: "bg-amber-50 text-amber-800 border-amber-200" },
  closed: { label: "Đã đóng", color: "bg-rose-50 text-rose-700 border-rose-200" },
};
const statusColors = {
  pending: "#64748B",        // slate-500
  interviewing: "#3B82F6",   // blue-500
  accepted: "#10B981",       // emerald-500
  rejected: "#EF4444",       // red-500
  withdrawn: "#8B5CF6",      // violet-500
};

// =====================
// Small reusable pieces
// =====================

const StatusBadge = ({ status }) => {
  const conf = applicationStatusMap[status] || {
    label: status,
    color: "bg-slate-100 text-slate-700 border-slate-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${conf.color}`}
    >
      {conf.label}
    </span>
  );
};

const JobStatusBadge = ({ status }) => {
  const conf = jobStatusMap[status] || {
    label: status,
    color: "bg-slate-100 text-slate-700 border-slate-300",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${conf.color}`}
    >
      {conf.label}
    </span>
  );
};

const StatCard = ({ label, value, icon, hint, highlight = false }) => {
  return (
    <Card className={highlight ? "border-blue-200 shadow-md" : ""}>
      <CardBody className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
            {label}
          </p>
          {icon && <span className="text-lg">{icon}</span>}
        </div>
        <div className="text-2xl font-bold text-slate-900">
          {value ?? "—"}
        </div>
        {hint && <p className="text-xs text-slate-500">{hint}</p>}
      </CardBody>
    </Card>
  );
};



// =====================
// Main Page Component
// =====================

export default function JobDashboardForHRPage() {
  const { id } = useParams(); // jobId trên URL
  const jobId = id;

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState("preset"); 
  const [filters, setFilters] = useState({
    range: "30d",
    from: "",
    to: "",
    latestLimit: 10,
    latestPage: 1,
  });

  // Fetch dashboard
  useEffect(() => {
    let isMounted = true;

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = {};

        // Nếu có from/to -> custom range, bỏ range
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        if (!filters.from && !filters.to && filters.range) {
          params.range = filters.range;
        }

        params.latest_limit = filters.latestLimit;
        params.latest_page = filters.latestPage;

        const res = await JobAPI.getDashboard(jobId, params);
        if (!isMounted) return;
        setDashboard(res.data.data); // theo chuỗi JSON backend trả về
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError("Không tải được dữ liệu dashboard. Vui lòng thử lại.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (jobId) {
      fetchDashboard();
    }

  }, [
    jobId,
    filters.range,
    filters.from,
    filters.to,
    filters.latestLimit,
    filters.latestPage,
  ]);
  const handleQuickRangeChange = (range) => {
    setFilters((prev) => ({
      ...prev,
      range,
      from: "",
      to: "",
      latestPage: 1,
    }));
  };

  const handleFromDateChange = (e) => {
    const value = e.target.value; // yyyy-MM-dd từ DatePickerInput
    setFilters((prev) => ({
      ...prev,
      from: value,
      range: "", // bỏ quick range → dùng custom
      latestPage: 1,
    }));
  };

  const handleToDateChange = (e) => {
    const value = e.target.value;
    setFilters((prev) => ({
      ...prev,
      to: value,
      range: "",
      latestPage: 1,
    }));
  };

  const handleLatestLimitChange = (e) => {
    setFilters((prev) => ({
      ...prev,
      latestLimit: Number(e.target.value) || 10,
      latestPage: 1,
    }));
  };

  const handlePrevPage = () => {
    setFilters((prev) => ({
      ...prev,
      latestPage: Math.max(1, prev.latestPage - 1),
    }));
  };

  const handleNextPage = () => {
    if (!dashboard) return;
    const totalPages = dashboard.latest_pagination.total_pages;
    setFilters((prev) => ({
      ...prev,
      latestPage: Math.min(totalPages, prev.latestPage + 1),
    }));
  };

  const funnelData = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.funnel.by_status.map((item) => ({
      ...item,
      label: applicationStatusMap[item.status]?.label || item.status,
    }));
  }, [dashboard]);

  const timelineData = useMemo(() => {
    if (!dashboard) return [];
    return dashboard.timeline.points.map((p) => ({
      ...p,
      displayDate: formatShortDate(p.date),
    }));
  }, [dashboard]);

  // ==========================
  // Render
  // ==========================

  if (loading && !dashboard) {
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">
          Đang tải dữ liệu dashboard...
        </p>
      </div>
    </div>
  );
}

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <Card className="max-w-md">
          <CardBody className="space-y-3">
            <p className="text-sm text-rose-600 font-semibold">{error}</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setFilters((prev) => ({ ...prev })); // trigger fetch lại
              }}
            >
              Thử tải lại
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <EmptyState text="Không tìm thấy dữ liệu dashboard cho job này" />
      </div>
    );
  }

  const { job, summary, latest_candidates, latest_pagination } = dashboard;

  return (
    <div className="min-h-screen bg-slate-50/70">
      {/* Header chung của trang */}
      <SectionHeader
        title={`Dashboard tuyển dụng`}
        subtitle={job?.title || `Job #${jobId}`}
        actions={
          <>
            <JobStatusBadge status={summary?.status} />
          </>
        }
      />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* ================== 1. SUMMARY CARDS ================== */}
        <Card>
          <CardHeader
            title="Tổng quan job"
            icon="📊"
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-4">
              <StatCard
                label="Lượt xem"
                value={summary?.views_count}
                icon="👀"
                hint="Tổng số lượt candidate xem job này"
                highlight
              />
              <StatCard
                label="Ứng tuyển"
                value={summary?.applications_count}
                icon="📩"
                hint="Tổng số đơn ứng tuyển"
              />
              <StatCard
                label="Lưu job"
                value={summary?.saved_count}
                icon="💾"
                hint="Số lần job được lưu"
              />
              <StatCard
                label="Số lượng cần tuyển"
                value={summary?.openings}
                icon="🎯"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3 mt-4">
              <Card className="md:col-span-2">
                <CardBody className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Ngày tạo
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDateTime(summary?.created_at)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Deadline
                    </p>
                    <p className="text-sm font-medium text-slate-900">
                      {formatDate(summary?.deadline)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                      Thời gian còn lại
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      {formatDaysLeft(summary?.days_left)}
                    </p>
                  </div>
                </CardBody>
              </Card>

              <Card>
                <CardBody className="space-y-3">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                    Trạng thái job
                  </p>
                  <JobStatusBadge status={summary?.status} />
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Trạng thái giúp bạn biết job đang hiển thị trên hệ thống,
                    đã hết hạn hay đã đóng tuyển.
                  </p>
                </CardBody>
              </Card>
            </div>
          </CardBody>
        </Card>

        {/* ================== 2. HIRING FUNNEL ================== */}
        <Card>
          <CardHeader
            title="Phễu tuyển dụng"
            icon="🪜"
          />
          <CardBody>
            {dashboard.funnel.total === 0 ? (
              <EmptyState text="Chưa có ứng viên nào cho job này" />
            ) : (
              <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData}>
                        
                      <defs>
                      {funnelData.map((item) => (
                        <linearGradient
                          key={item.status}
                          id={`grad-${item.status}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop offset="0%" stopColor={statusColors[item.status]} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={statusColors[item.status]} stopOpacity={0.6} />
                        </linearGradient>
                      ))}
                    </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                        <YAxis allowDecimals={false} />
                        <Tooltip
                        formatter={(value) => [`${value} ứng viên`, "Số lượng"]}
                        labelFormatter={(label) => `Trạng thái: ${label}`}
                        />
                        
                        <Bar
                          dataKey="count"
                          radius={[8, 8, 0, 0]}
                        >
                          {funnelData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={`url(#grad-${entry.status})`}
                            />
                          ))}
                        </Bar>
                    </BarChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-900">
                    Tổng:{" "}
                    <span className="text-blue-600">
                      {dashboard.funnel.total} ứng viên
                    </span>
                  </p>
                  <ul className="space-y-2 text-sm">
                    {funnelData.map((item) => (
                      <li
                        key={item.status}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <StatusBadge status={item.status} />
                          <span className="text-slate-500">
                            {item.status === "pending" &&
                              "Ứng viên chờ xử lý"}
                            {item.status === "interviewing" &&
                              "Đang trong vòng phỏng vấn"}
                            {item.status === "accepted" && "Đã nhận offer"}
                            {item.status === "rejected" && "Đã bị từ chối"}
                            {item.status === "withdrawn" &&
                              "Ứng viên tự rút hồ sơ"}
                          </span>
                        </div>
                        <span className="font-semibold text-slate-900">
                          {item.count}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-slate-500">
                    Phễu tuyển dụng giúp bạn thấy ứng viên rớt nhiều ở bước nào,
                    có xử lý hết hồ sơ hay không, và chất lượng ứng viên qua
                    từng vòng.
                  </p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* ================== 3. LINE CHART ================== */}
        <Card>
                <CardHeader
                    title="Ứng viên theo thời gian"
                    icon="📈"
                />
                <CardBody className="space-y-4">

                    {/* ========== RADIO SELECT MODE ========== */}
                    <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                        type="radio"
                        name="timelineMode"
                        value="preset"
                        checked={filterMode === "preset"}
                        onChange={() => {
                            setFilterMode("preset");
                            setFilters(prev => ({
                            ...prev,
                            from: "",
                            to: "",
                            range: prev.range || "30d",
                            }));
                        }}
                        />
                        <span className="text-sm font-medium text-slate-700">Theo mục có sẵn</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                        type="radio"
                        name="timelineMode"
                        value="custom"
                        checked={filterMode === "custom"}
                        onChange={() => {
                            setFilterMode("custom");
                            setFilters(prev => ({
                            ...prev,
                            range: "",
                            }));
                        }}
                        />
                        <span className="text-sm font-medium text-slate-700">Theo ngày tùy chỉnh</span>
                    </label>
                    </div>

                    {/* ========== PRESET QUICK RANGE ========== */}
                    {filterMode === "preset" && (
                    <div className="flex flex-wrap gap-2">
                        {[
                        { key: "7d", label: "7 ngày" },
                        { key: "14d", label: "14 ngày" },
                        { key: "30d", label: "30 ngày" },
                        { key: "all", label: "Tất cả" },
                        ].map(item => (
                        <button
                            key={item.key}
                            type="button"
                            onClick={() => handleQuickRangeChange(item.key)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            filters.range === item.key
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-blue-50"
                            }`}
                        >
                            {item.label}
                        </button>
                        ))}
                    </div>
                    )}

                    {/* ========== CUSTOM DATES ========== */}
                    {filterMode === "custom" && (
                        <div className="flex flex-wrap gap-4 items-end">
                            <div className="w-40">
                            <DatePickerInput
                                label="Từ ngày"
                                name="from"
                                value={filters.from}
                                onChange={handleFromDateChange}
                            />
                            </div>

                            <div className="w-40">
                            <DatePickerInput
                                label="Đến ngày"
                                name="to"
                                value={filters.to}
                                onChange={handleToDateChange}
                            />
                            </div>

                            <button
                            type="button"
                            onClick={() =>
                                setFilters(prev => ({
                                ...prev,
                                from: "",
                                to: "",
                                }))
                            }
                            className="px-3 py-2 text-xs font-medium bg-slate-100 hover:bg-slate-200 border rounded-lg"
                            >
                            Xóa lọc
                            </button>
                        </div>
                        )}

                    {/* ========== LINE CHART ========== */}
                    {timelineData.length === 0 ? (
                    <EmptyState text="Chưa có đơn ứng tuyển trong khoảng thời gian này" />
                    ) : (
                    <div 
                        className="w-full"
                        style={{
                            height: 300,
                            minHeight: 300,
                            position: "relative",
                            overflow: "visible",   // ⭐ dropdown không bị cắt
                        }}
                        >
                        <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={timelineData} margin={{ left: -20, right: 10 }}>
                          
                          {/* === GRADIENT DEFINITIONS === */}
                          <defs>
                            <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#2563EB" />  {/* blue-600 */}
                              <stop offset="100%" stopColor="#1D4ED8" /> {/* blue-700 */}
                            </linearGradient>
                          </defs>

                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          
                          <XAxis
                            dataKey="displayDate"
                            tick={{ fontSize: 10 }}
                            interval="preserveStartEnd"
                          />

                          <YAxis allowDecimals={false} />

                          <Tooltip
                            formatter={(value) => [`${value} ứng viên`, "Số đơn"]}
                            labelFormatter={(label, payload) => {
                              if (!payload || payload.length === 0) return label;
                              const rawDate = payload[0].payload.date;
                              return formatDate(rawDate);
                            }}
                          />

                          {/* === LINE WITH GRADIENT COLOR === */}
                          <Line
                            type="monotone"
                            dataKey="applications_count"
                            stroke="url(#lineGradient)"
                            strokeWidth={3}
                            dot={{
                              r: 4,
                              stroke: "#1D4ED8",    // blue-700
                              strokeWidth: 2,
                              fill: "#ffffff"
                            }}
                            activeDot={{
                              r: 6,
                              stroke: "#1D4ED8",
                              strokeWidth: 2,
                              fill: "#ffffff"
                            }}
                          />

                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    )}

                    <p className="text-xs text-slate-500 leading-relaxed">
                    Biểu đồ này cho thấy job đang “nóng” hay “nguội”, sau khi chỉnh JD hoặc
                    gia hạn deadline thì số ứng viên tăng hay giảm, và khoảng thời gian nào
                    ứng viên nộp hồ sơ nhiều nhất.
                    </p>
                </CardBody>
                </Card>


        {/* ================== 4. LATEST CANDIDATES ================== */}
        <Card>
          <CardHeader
            title="Ứng viên mới nhất"
            icon="🧑‍💼"
          />
          <CardBody className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Hiển thị{" "}
                <span className="font-semibold">
                  {latest_candidates.length}
                </span>{" "}
                ứng viên gần nhất (tổng{" "}
                <span className="font-semibold">
                  {latest_pagination.total_items}
                </span>
                ).
              </p>

              <div className="flex items-center gap-3">
                <div className="w-28">
                  <TextInput
                    label="Số dòng"
                    name="latestLimit"
                    type="number"
                    min={1}
                    value={filters.latestLimit}
                    onChange={handleLatestLimitChange}
                  />
                </div>
              </div>
            </div>

            {latest_candidates.length === 0 ? (
              <EmptyState text="Chưa có ứng viên nào nộp gần đây" />
            ) : (
              <div className="space-y-3">
                {latest_candidates.map((item) => (
                  <div
                    key={item.application_id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center justify-between border border-slate-100 rounded-xl p-4 bg-white hover:border-blue-200 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={
                          item.candidate.avatar_url ||
                          "https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(item.candidate.full_name)
                        }
                        alt={item.candidate.full_name}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-slate-900">
                            {item.candidate.full_name}
                          </p>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-xs text-slate-500">
                          Nộp ngày: {formatDateTime(item.applied_at)}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <span className="text-slate-400">CV:</span>
                            <a
                              href={item.cv.file_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline underline-offset-2"
                            >
                              {item.cv.title}
                            </a>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          // tuỳ bạn gắn route chi tiết hồ sơ ứng viên
                          // ví dụ: navigate(`/hr/applications/${item.application_id}`)
                        }}
                      >
                        Xem hồ sơ
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>

          <CardFooter className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs text-slate-500">
              Trang{" "}
              <span className="font-semibold">
                {latest_pagination.page}/{latest_pagination.total_pages}
              </span>
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                disabled={latest_pagination.page <= 1}
                onClick={handlePrevPage}
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  latest_pagination.page >= latest_pagination.total_pages
                }
                onClick={handleNextPage}
              >
                Trang sau
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
