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
  Area,
  AreaChart,
} from "recharts";
import { 
  Users, 
  Eye, 
  FileText, 
  Bookmark, 
  Target, 
  Calendar, 
  Clock, 
  Briefcase 
} from "lucide-react"; // Gợi ý: Dùng icon từ thư viện phổ biến (nếu có) hoặc giữ nguyên emoji cũ nếu không muốn cài thêm. Ở đây tôi dùng emoji cũ nhưng style lại đẹp hơn.

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

// Update colors to be softer and more modern (Pastel tones)
const applicationStatusMap = {
  pending: {
    label: "Chờ xử lý",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-500"
  },
  interviewing: {
    label: "Phỏng vấn",
    color: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "bg-blue-500"
  },
  accepted: {
    label: "Đã nhận",
    color: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dot: "bg-emerald-500"
  },
  rejected: {
    label: "Từ chối",
    color: "bg-rose-50 text-rose-700 border-rose-200",
    dot: "bg-rose-500"
  },
  withdrawn: {
    label: "Rút hồ sơ",
    color: "bg-purple-50 text-purple-700 border-purple-200",
    dot: "bg-purple-500"
  },
};

const jobStatusMap = {
  active: { label: "Đang hiển thị", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  hidden: { label: "Đang ẩn", color: "bg-gray-100 text-gray-700 border-gray-200" },
  expired: { label: "Hết hạn", color: "bg-amber-100 text-amber-800 border-amber-200" },
  closed: { label: "Đã đóng", color: "bg-rose-100 text-rose-800 border-rose-200" },
};

const statusColors = {
  pending: "#94A3B8",      // slate-400
  interviewing: "#3B82F6", // blue-500
  accepted: "#10B981",     // emerald-500
  rejected: "#F43F5E",     // rose-500
  withdrawn: "#8B5CF6",    // violet-500
};

// =====================
// Custom Recharts Components
// =====================

const CustomTooltip = ({ active, payload, label, suffix = "" }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-lg text-sm">
        <p className="font-semibold text-slate-700 mb-1">{label}</p>
        <p className="text-indigo-600 font-bold">
          {payload[0].value} {suffix}
        </p>
      </div>
    );
  }
  return null;
};

// =====================
// Small reusable pieces
// =====================

const StatusBadge = ({ status }) => {
  const conf = applicationStatusMap[status] || {
    label: status,
    color: "bg-gray-100 text-gray-700 border-gray-200",
    dot: "bg-gray-400"
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${conf.color}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${conf.dot}`} />
      {conf.label}
    </span>
  );
};

const JobStatusBadge = ({ status }) => {
  const conf = jobStatusMap[status] || {
    label: status,
    color: "bg-gray-100 text-gray-700 border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold border ${conf.color} shadow-sm`}
    >
      {conf.label}
    </span>
  );
};

const StatCard = ({ label, value, icon, hint, highlight = false }) => {
  return (
    <Card className={`transition-all duration-200 hover:-translate-y-1 ${highlight ? "ring-2 ring-indigo-50 border-indigo-100 shadow-md" : "hover:shadow-md border-slate-100"}`}>
      <CardBody className="p-5 flex flex-col justify-between h-full">
        <div className="flex items-start justify-between mb-2">
          <p className="text-[11px] font-bold tracking-widest text-slate-400 uppercase">
            {label}
          </p>
          <div className={`p-2 rounded-lg ${highlight ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
            <span className="text-lg leading-none">{icon}</span>
          </div>
        </div>
        <div>
            <div className={`text-3xl font-extrabold tracking-tight ${highlight ? 'text-indigo-600' : 'text-slate-800'}`}>
            {value ?? "—"}
            </div>
            {hint && <p className="text-xs text-slate-400 mt-1 font-medium">{hint}</p>}
        </div>
      </CardBody>
    </Card>
  );
};

// =====================
// Main Page Component
// =====================

export default function JobDashboardForHRPage() {
  const { id } = useParams();
  const jobId = id;

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterMode, setFilterMode] = useState("preset");
  const [filters, setFilters] = useState({
    range: "30d",
    from: "",
    to: "",
    latestLimit: 5, // Default giảm xuống 5 cho gọn đẹp
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
        if (filters.from) params.from = filters.from;
        if (filters.to) params.to = filters.to;
        if (!filters.from && !filters.to && filters.range) {
          params.range = filters.range;
        }
        params.latest_limit = filters.latestLimit;
        params.latest_page = filters.latestPage;

        const res = await JobAPI.getDashboard(jobId, params);
        if (!isMounted) return;
        setDashboard(res.data.data);
      } catch (err) {
        console.error(err);
        if (!isMounted) return;
        setError("Không tải được dữ liệu dashboard. Vui lòng thử lại.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    if (jobId) fetchDashboard();
  }, [jobId, filters.range, filters.from, filters.to, filters.latestLimit, filters.latestPage]);

  const handleQuickRangeChange = (range) => {
    setFilters((prev) => ({ ...prev, range, from: "", to: "", latestPage: 1 }));
  };

  const handleFromDateChange = (e) => {
    setFilters((prev) => ({ ...prev, from: e.target.value, range: "", latestPage: 1 }));
  };

  const handleToDateChange = (e) => {
    setFilters((prev) => ({ ...prev, to: e.target.value, range: "", latestPage: 1 }));
  };

  const handleLatestLimitChange = (e) => {
    setFilters((prev) => ({ ...prev, latestLimit: Number(e.target.value) || 10, latestPage: 1 }));
  };

  const handlePrevPage = () => {
    setFilters((prev) => ({ ...prev, latestPage: Math.max(1, prev.latestPage - 1) }));
  };

  const handleNextPage = () => {
    if (!dashboard) return;
    const totalPages = dashboard.latest_pagination.total_pages;
    setFilters((prev) => ({ ...prev, latestPage: Math.min(totalPages, prev.latestPage + 1) }));
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
      fullDate: formatDate(p.date), // For tooltip
    }));
  }, [dashboard]);

  // ==========================
  // Render
  // ==========================

  if (loading && !dashboard) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin shadow-lg" />
          <p className="text-sm font-medium text-slate-500 animate-pulse">
            Đang tổng hợp dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gray-50/50">
        <Card className="max-w-md shadow-lg border-red-100">
          <CardBody className="space-y-4 text-center py-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 text-xl">⚠️</div>
            <p className="text-slate-700 font-medium">{error}</p>
            <Button variant="primary" onClick={() => setFilters((prev) => ({ ...prev }))}>
              Thử tải lại
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-[500px] flex items-center justify-center bg-gray-50">
        <EmptyState text="Không tìm thấy dữ liệu dashboard cho job này" />
      </div>
    );
  }

  const { job, summary, latest_candidates, latest_pagination } = dashboard;

return (
    <div className="min-h-screen bg-gray-50/80 pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto">
          <SectionHeader
            title="Dashboard Tuyển Dụng"
            subtitle={<span className="text-slate-500 font-normal">Tổng quan hiệu quả cho vị trí <strong className="text-slate-800">{job?.title || `#${jobId}`}</strong></span>}
            actions={<JobStatusBadge status={summary?.status} />}
            className="py-5"
          />
        </div>
      </div>

      {/* --- FIX 1: Dùng flex-col gap-8 thay vì space-y-8 để tránh lỗi margin collapsing --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-8">
        
        {/* ================== 1. STATS OVERVIEW ================== */}
        <section>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <StatCard label="Lượt xem Job" value={summary?.views_count} icon="👁️" hint="Tổng lượt tiếp cận" highlight />
            <StatCard label="Hồ sơ ứng tuyển" value={summary?.applications_count} icon="📥" hint="Tổng đơn nhận được" />
            <StatCard label="Lượt lưu tin" value={summary?.saved_count} icon="🔖" hint="Ứng viên quan tâm" />
            <StatCard label="Chỉ tiêu tuyển" value={summary?.openings} icon="🎯" hint="Số lượng cần tuyển" />
          </div>

          <Card className="border-slate-100 shadow-sm bg-white overflow-hidden">
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
              <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">🗓️</div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ngày tạo</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{formatDateTime(summary?.created_at)}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">⏳</div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deadline</p>
                  <p className="text-sm font-semibold text-slate-800 mt-1">{formatDate(summary?.deadline)}</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">⏰</div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Thời gian còn lại</p>
                  <p className="text-sm font-bold text-emerald-600 mt-1">{formatDaysLeft(summary?.days_left)}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ================== 2. CHARTS SECTION ================== */}
        {/* Không cần mb-8 nữa vì đã có gap-8 ở cha */}
        <section> 
          <div className="grid lg:grid-cols-3 gap-6 items-stretch">
            
            {/* --- FUNNEL CHART --- */}
            {/* FIX 2: h-auto cho mobile, lg:h-full cho desktop */}
            <Card className="lg:col-span-1 shadow-sm border-slate-100 h-full flex flex-col overflow-hidden">
              <CardHeader title="Phễu Tuyển Dụng" icon="🪜" className="border-b border-slate-50 pb-3" />
              <CardBody className="p-5 flex flex-col justify-between h-full">
                {dashboard.funnel.total === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-3">📭</div>
                    <p className="text-slate-500 text-sm">Chưa có dữ liệu ứng viên</p>
                  </div>
                ) : (
                  <>
                    <div className="h-64 -mx-2">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart layout="vertical" data={funnelData} margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 11, fill: '#64748B' }} interval={0} />
                          <Tooltip cursor={{ fill: 'transparent' }} content={<CustomTooltip suffix="ứng viên" />} />
                          <Bar dataKey="count" radius={[0, 4, 4, 0]} barSize={24}>
                            {funnelData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={statusColors[entry.status] || '#CBD5E1'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between text-sm pb-2 border-b border-slate-50">
                        <span className="text-slate-500 font-medium">Tổng hồ sơ</span>
                        <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">{dashboard.funnel.total}</span>
                      </div>
                      <ul className="space-y-2">
                        {funnelData.map((item) => (
                          <li key={item.status} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: statusColors[item.status] }}></span>
                              <span className="text-slate-600">{item.label}</span>
                            </div>
                            <span className="font-semibold text-slate-800">{item.count}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

            {/* --- TIMELINE CHART --- */}
            {/* FIX 2: h-auto cho mobile, lg:h-full cho desktop */}
            <Card className="lg:col-span-2 shadow-sm border-slate-100 h-full flex flex-col overflow-hidden">
              <CardHeader title="Xu Hướng Ứng Tuyển" icon="📈" className="border-b border-slate-50 pb-3" />
              <CardBody className="p-5">
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="bg-slate-100 p-1 rounded-lg inline-flex self-start">
                    <button
                      onClick={() => { setFilterMode("preset"); handleQuickRangeChange("30d"); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterMode === 'preset' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Mốc có sẵn
                    </button>
                    <button
                      onClick={() => { setFilterMode("custom"); setFilters(p => ({ ...p, range: "" })); }}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterMode === 'custom' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Tùy chỉnh
                    </button>
                  </div>

                  {filterMode === "preset" ? (
                    <div className="flex gap-2">
                      {[{ key: "7d", label: "7 ngày" }, { key: "14d", label: "14 ngày" }, { key: "30d", label: "30 ngày" }, { key: "all", label: "Tất cả" }].map(item => (
                        <button
                          key={item.key}
                          onClick={() => handleQuickRangeChange(item.key)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${filters.range === item.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200 hover:border-indigo-300"}`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="w-32"><DatePickerInput value={filters.from} onChange={handleFromDateChange} placeholder="Từ ngày" className="text-xs py-1" /></div>
                      <span className="text-slate-400">-</span>
                      <div className="w-32"><DatePickerInput value={filters.to} onChange={handleToDateChange} placeholder="Đến ngày" className="text-xs py-1" /></div>
                    </div>
                  )}
                </div>

                {/* Chart Area */}
                <div className="h-[320px] w-full bg-slate-50/50 rounded-xl border border-slate-100 p-2">
                  {timelineData.length === 0 ? (
                    <EmptyState text="Không có dữ liệu trong khoảng thời gian này" />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4F46E5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} tickMargin={10} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip suffix="đơn" />} cursor={{ stroke: '#4F46E5', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area type="monotone" dataKey="applications_count" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" activeDot={{ r: 6, strokeWidth: 0, fill: '#4338ca' }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </section>

        {/* ================== 3. LATEST CANDIDATES LIST ================== */}
        <section>
          <Card className="shadow-sm border-slate-100 overflow-hidden">
            <CardHeader
              title="Ứng Viên Mới Nhất"
              icon="🧑‍💼"
              className="bg-white border-b border-slate-100 py-4 px-6"
              action={
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 hidden sm:inline-block">Hiển thị</span>
                  <div className="w-20">
                    <TextInput type="number" min={1} value={filters.latestLimit} onChange={handleLatestLimitChange} className="py-1 text-center text-sm" />
                  </div>
                </div>
              }
            />

            <CardBody className="p-0">
              {latest_candidates.length === 0 ? (
                <div className="p-10"><EmptyState text="Chưa có ứng viên nào gần đây" /></div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {latest_candidates.map((item) => (
                    <div key={item.application_id} className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 hover:bg-slate-50 transition-colors duration-200">
                      {/* Avatar & Info */}
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative shrink-0">
                          <img
                            src={item.candidate.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.candidate.full_name)}&background=random`}
                            alt={item.candidate.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="font-semibold text-sm text-slate-900 truncate">{item.candidate.full_name}</span>
                            <StatusBadge status={item.status} />
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span>{formatDateTime(item.applied_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                        {item.cv && (
                          <a href={item.cv.file_url} target="_blank" rel="noreferrer" title={item.cv.title} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:text-indigo-600 hover:border-indigo-300 transition-all max-w-[200px]">
                            <span className="shrink-0">📄</span>
                            <span className="truncate">{item.cv.title || "Xem CV"}</span>
                          </a>
                        )}
                        <Button size="sm" variant="secondary" className="px-4 shadow-sm bg-white hover:bg-slate-100 border border-slate-200" onClick={() => { }}>
                          Chi tiết
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>

            <CardFooter className="bg-slate-50/50 border-t border-slate-100 py-3 px-6 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Trang {latest_pagination.page} / {latest_pagination.total_pages}</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={latest_pagination.page <= 1} onClick={handlePrevPage} className="text-xs bg-white">← Trước</Button>
                <Button variant="outline" size="sm" disabled={latest_pagination.page >= latest_pagination.total_pages} onClick={handleNextPage} className="text-xs bg-white">Sau →</Button>
              </div>
            </CardFooter>
          </Card>
        </section>
      </div>
    </div>
  );
}