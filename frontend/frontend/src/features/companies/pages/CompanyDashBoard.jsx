// src/pages/dashboard/RecruiterDashboard.jsx
import { useEffect, useState, useMemo } from "react";
import {
  Building2,
  BarChart3,
  Users,
  FileClock,
  Flame,
  Globe,
  Loader2,
  Filter,
  CalendarRange,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
  MoreHorizontal
} from "lucide-react";

import CompanyAPI from "../CompanyAPI";

// Giả định các components này đã tồn tại trong project của bạn
// Nếu bạn muốn style lại Button/Input, hãy chỉnh trong các file đó,
// ở đây tôi sử dụng className để override style khi cần thiết.
import Button from "@/components/ui/Button";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { Card, CardHeader, CardBody } from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

// =========================
// Helper Format Functions
// =========================
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit", year: "numeric" });
};

const formatCompanySize = (size) => {
  if (!size) return "—";
  const map = {
    small: "< 50 nhân sự",
    medium: "50 - 200 nhân sự",
    large: "> 200 nhân sự",
  };
  return map[size] || size;
};

// =========================
// CONSTANTS
// =========================
const FILTER_MODES = {
  QUICK: "quick",
  CUSTOM: "custom",
};

const QUICK_RANGES = [
  { value: "7d", label: "7 ngày qua" },
  { value: "30d", label: "30 ngày qua" },
  { value: "all", label: "Tất cả" },
];

const DEFAULT_FILTERS = {
  range: "7d",
  from: "",
  to: "",
};

// =========================
// Main Component
// =========================

export default function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  // Filter State
  const [filterMode, setFilterMode] = useState(FILTER_MODES.QUICK); // 'quick' | 'custom'
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Loading States
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState(null);

  // =========================
  // API Interactions
  // =========================
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoadingCompany(true);
        const res = await CompanyAPI.getMyCompany();
        setCompany(res.data.data);
      } catch (err) {
        console.error("Failed to load company", err);
        // Không set error block ở đây để tránh chặn UI dashboard nếu chỉ lỗi info công ty
      } finally {
        setLoadingCompany(false);
      }
    };
    fetchCompany();
  }, []);

  const loadDashboard = async (currentFilters, { initial = false, showChartLoader = false } = {}) => {
    try {
      if (initial) setLoadingInitial(true);
      if (showChartLoader) setLoadingChart(true);

      const params = {
        topJobsLimit: 5,
        recentApplicationsLimit: 8,
        upcomingInterviewsLimit: 5,
      };

      // Logic ưu tiên tham số gửi lên
      if (currentFilters.from && currentFilters.to) {
        params.from = currentFilters.from;
        params.to = currentFilters.to;
      } else {
        params.range = currentFilters.range || "7d";
      }

      const res = await CompanyAPI.getRecruiterDashboard(params);
      setDashboardData(res.data.data);
      setError(null);
    } catch (err) {
      console.error("Failed to load dashboard", err);
      setError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      if (initial) setLoadingInitial(false);
      if (showChartLoader) setLoadingChart(false);
    }
  };

  // Initial Load
  useEffect(() => {
    loadDashboard(DEFAULT_FILTERS, { initial: true });
  }, []);

  // =========================
  // Handlers
  // =========================

  // Chuyển tab Quick <-> Custom
  const handleModeChange = (mode) => {
    setFilterMode(mode);
    if (mode === FILTER_MODES.QUICK) {
      // Reset về mặc định 7 ngày nếu chuyển về tab nhanh
      const resetFilters = { ...DEFAULT_FILTERS };
      setFilters(resetFilters);
      loadDashboard(resetFilters, { showChartLoader: true });
    } else {
      // Chuyển sang custom nhưng chưa load gì cả, đợi user chọn ngày và bấm Apply
      setFilters((prev) => ({ ...prev, range: "" }));
    }
  };

  const handleQuickRangeSelect = (rangeVal) => {
    const newFilters = { range: rangeVal, from: "", to: "" };
    setFilters(newFilters);
    loadDashboard(newFilters, { showChartLoader: true });
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCustom = () => {
    if (!filters.from || !filters.to) return;
    loadDashboard(filters, { showChartLoader: true });
  };

  // =========================
  // Data Preparation
  // =========================
  const kpis = dashboardData?.kpis || {};
  const chartData = dashboardData?.applicationTimeline?.points || [];
  const topJobs = dashboardData?.topJobs || [];
  const recentApplications = dashboardData?.recentApplications || [];
  const upcomingInterviews = dashboardData?.upcomingInterviews || [];

  const isGlobalLoading = loadingCompany || loadingInitial;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Tổng quan tuyển dụng
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Theo dõi hiệu quả và tiến độ tuyển dụng của {company?.name || "công ty"}.
            </p>
          </div>

          {/* Company Mini Badge */}
          {!loadingCompany && company && (
            <div className="hidden md:flex items-center gap-3 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
              {company.logo_url ? (
                <img src={company.logo_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                  {company.name[0]}
                </div>
              )}
              <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">{company.name}</span>
            </div>
          )}
        </div>

        {/* --- ERROR STATE --- */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm text-red-700 font-medium">{error}</span>
            <Button size="sm" variant="outline" className="bg-white hover:bg-red-50 text-red-700 border-red-200" onClick={() => window.location.reload()}>
              Tải lại trang
            </Button>
          </div>
        )}

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="Job đang tuyển"
            value={kpis.totalActiveJobs}
            icon={Briefcase}
            color="blue"
            loading={isGlobalLoading}
          />
          <StatCard
            label="Lượt xem Job"
            value={kpis.totalJobViews}
            icon={Flame}
            color="orange"
            loading={isGlobalLoading}
          />
          <StatCard
            label="Tổng ứng tuyển"
            value={kpis.totalApplications}
            icon={Users}
            color="emerald"
            loading={isGlobalLoading}
          />
          <StatCard
            label="Ứng viên mới (7d)"
            value={kpis.newCandidatesLast7Days}
            icon={TrendingUp}
            color="cyan"
            loading={isGlobalLoading}
            highlight
          />
          <StatCard
            label="Đơn mới (7d)"
            value={kpis.newApplicationsLast7Days}
            icon={FileClock}
            color="indigo"
            loading={isGlobalLoading}
            highlight
          />
          <StatCard
            label="Lịch phỏng vấn"
            value={kpis.upcomingInterviews}
            icon={CalendarRange}
            color="violet"
            loading={isGlobalLoading}
          />
        </div>

        {/* --- MAIN CHART SECTION --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* LEFT: CHART & FILTERS */}
          <div className="xl:col-span-2 space-y-6">
            <Card className="shadow-sm border-gray-200 overflow-visible">
              <CardHeader
                className="border-b border-gray-100 pb-4"
                title={
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <span>Biểu đồ ứng tuyển</span>
                  </div>
                }
              />
              <CardBody className="pt-6">

                {/* Custom Tab Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  {/* Mode Switcher */}
                  <div className="bg-gray-100/80 p-1 rounded-lg inline-flex self-start">
                    <button
                      onClick={() => handleModeChange(FILTER_MODES.QUICK)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterMode === FILTER_MODES.QUICK
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Chọn nhanh
                    </button>
                    <button
                      onClick={() => handleModeChange(FILTER_MODES.CUSTOM)}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${filterMode === FILTER_MODES.CUSTOM
                        ? "bg-white text-gray-900 shadow-sm"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                      Tùy chỉnh ngày
                    </button>
                  </div>

                  {/* Filter Content based on Mode */}
                  <div className="flex-1 flex justify-end">
                    {filterMode === FILTER_MODES.QUICK ? (
                      <div className="flex gap-2">
                        {QUICK_RANGES.map((item) => (
                          <button
                            key={item.value}
                            onClick={() => handleQuickRangeSelect(item.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${filters.range === item.value
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                              }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-32">
                          <DatePickerInput
                            placeholderText="Từ ngày"
                            name="from"
                            value={filters.from}
                            onChange={handleDateChange}
                            className="!h-9 !text-xs"
                          />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="w-32">
                          <DatePickerInput
                            placeholderText="Đến ngày"
                            name="to"
                            value={filters.to}
                            onChange={handleDateChange}
                            className="!h-9 !text-xs"
                          />
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          className="!h-9 !px-3"
                          disabled={!filters.from || !filters.to}
                          onClick={handleApplyCustom}
                        >
                          Lọc
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart Area */}
                <div className="relative h-[300px] w-full">
                  {loadingChart && (
                    <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-[1px]">
                      <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    </div>
                  )}

                  {isGlobalLoading ? (
                    <div className="h-full w-full bg-gray-100 rounded-lg animate-pulse" />
                  ) : chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                          tickMargin={10}
                        />
                        <YAxis
                          tick={{ fontSize: 11, fill: "#94a3b8" }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorApps)"
                          activeDot={{ r: 6, strokeWidth: 0, fill: '#4f46e5' }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState text="Không có dữ liệu trong khoảng thời gian này." />
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Recent Applications Table */}
            <Card className="shadow-sm border-gray-200">
              <CardHeader
                className="border-b border-gray-100"
                title="Ứng viên mới ứng tuyển"
                icon={<Users className="w-4 h-4 text-emerald-600" />}
              />
              <CardBody className="p-0">
                {isGlobalLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}
                  </div>
                ) : recentApplications.length === 0 ? (
                  <div className="p-8"><EmptyState text="Chưa có ứng viên nào gần đây." /></div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {recentApplications.map((app) => (
                      <div key={app.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                            {(app.candidate?.full_name || "U")[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{app.candidate?.full_name}</p>
                            <p className="text-xs text-gray-500">Ứng tuyển: {app.job?.title}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <StatusBadge status={app.status} type="application" />
                          <p className="text-[10px] text-gray-400 mt-1">{formatDateTime(app.applied_at)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* RIGHT: TOP JOBS & INTERVIEWS */}
          <div className="space-y-6">

            {/* Top Jobs */}
            <Card className="shadow-sm border-gray-200 h-fit">
              <CardHeader
                title="Top Job hấp dẫn"
                icon={<Flame className="w-4 h-4 text-amber-500" />}
                className="border-b border-gray-100"
              />
              <CardBody className="p-0">
                {isGlobalLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />)}
                  </div>
                ) : topJobs.length === 0 ? (
                  <div className="p-6"><EmptyState text="Chưa có dữ liệu." /></div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {topJobs.map((job, idx) => (
                      <div key={job.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-gray-400">#{idx + 1}</span>
                          <StatusBadge status={job.status} type="job" mini />
                        </div>
                        <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 mb-2" title={job.title}>
                          {job.title}
                        </h3>

                        <div className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span className="font-medium text-gray-900">{job._count?.applications || 0}</span>
                            <span className="text-[10px]">đơn</span>
                          </div>
                          <div className="w-px h-3 bg-gray-300"></div>
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            <span className="font-medium text-gray-900">{job.views_count || 0}</span>
                            <span className="text-[10px]">xem</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Interviews */}
            <Card className="shadow-sm border-gray-200 h-fit">
              <CardHeader
                title="Lịch phỏng vấn sắp tới"
                icon={<Clock className="w-4 h-4 text-violet-500" />}
                className="border-b border-gray-100"
              />
              <CardBody className="p-0">
                {isGlobalLoading ? (
                  <div className="p-4 space-y-4">
                    {[1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}
                  </div>
                ) : upcomingInterviews.length === 0 ? (
                  <div className="p-6"><EmptyState text="Không có lịch phỏng vấn." /></div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {upcomingInterviews.map((item) => {
                      const cName = item.application?.candidate?.user?.full_name || item.candidate?.full_name;
                      const jTitle = item.application?.job?.title || item.job?.title;
                      return (
                        <div key={item.id} className="p-4 flex gap-3 hover:bg-gray-50">
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-12 bg-violet-50 text-violet-700 rounded-lg border border-violet-100">
                            <span className="text-xs font-bold uppercase">{new Date(item.scheduled_at).toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-lg font-bold leading-none">{new Date(item.scheduled_at).getDate()}</span>
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-semibold text-gray-900 truncate">{cName}</p>
                            <p className="text-xs text-gray-500 truncate mb-1">{jTitle}</p>
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] uppercase font-bold">
                                {new Date(item.scheduled_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${item.mode === 'online' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                }`}>
                                {item.mode === 'online' ? 'Online' : 'Offline'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardBody>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}

// =========================
// Sub Components & UI Parts
// =========================

function StatCard({ label, value, icon: Icon, color, loading, highlight }) {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    emerald: "bg-emerald-50 text-emerald-600",
    violet: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
    cyan: "bg-cyan-50 text-cyan-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-200 hover:shadow-md ${highlight ? "bg-white border-indigo-200 shadow-sm" : "bg-white border-gray-100 shadow-sm"
      }`}>
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg ${colorStyles[color] || "bg-gray-50 text-gray-600"}`}>
          <Icon className="w-5 h-5" />
        </div>
        {highlight && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Quan trọng" />}
      </div>
      <div className="mt-3">
        {loading ? (
          <div className="h-8 w-16 bg-gray-100 rounded animate-pulse" />
        ) : (
          <p className="text-2xl font-bold text-gray-900">{value ?? 0}</p>
        )}
        <p className="text-xs font-medium text-gray-500 mt-1">{label}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status, type, mini }) {
  let styles = "bg-gray-100 text-gray-600 border-gray-200";
  let label = status;

  if (type === "job") {
    if (status === "active") { styles = "bg-emerald-50 text-emerald-700 border-emerald-200"; label = "Đang tuyển"; }
    else if (status === "closed") { styles = "bg-gray-100 text-gray-600 border-gray-200"; label = "Đã đóng"; }
    else if (status === "hidden") { styles = "bg-yellow-50 text-yellow-700 border-yellow-200"; label = "Đang ẩn"; }
  } else if (type === "application") {
    if (status === "pending") { styles = "bg-blue-50 text-blue-700 border-blue-200"; label = "Chờ duyệt"; }
    else if (status === "interviewing") { styles = "bg-violet-50 text-violet-700 border-violet-200"; label = "Phỏng vấn"; }
    else if (status === "accepted") { styles = "bg-emerald-50 text-emerald-700 border-emerald-200"; label = "Đã nhận"; }
    else if (status === "rejected") { styles = "bg-red-50 text-red-700 border-red-200"; label = "Từ chối"; }
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap ${styles} ${mini ? 'px-1.5' : ''}`}>
      {label}
    </span>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-100 p-3 rounded-lg shadow-xl text-xs">
        <p className="font-semibold text-gray-900 mb-1">{formatDate(label)}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          <span className="text-gray-500">Ứng tuyển:</span>
          <span className="font-bold text-indigo-600 text-sm">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
}