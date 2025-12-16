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
  MoreHorizontal,
  Sparkles,
  ChevronRight
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

import CompanyAPI from "../CompanyAPI";

// Import UI Components (Giữ nguyên)
import Button from "@/components/ui/Button";
import DatePickerInput from "@/components/ui/DatePickerInput";
import { Card, CardHeader, CardBody } from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";

// =========================
// Helper Format Functions
// =========================
const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }); // Gọn hơn
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" });
};

// =========================
// Premium Components
// =========================

// 1. Skeleton Loading Sang Trọng
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />
);

const DashboardSkeleton = () => (
  <div className="space-y-8 animate-in fade-in duration-700">
    {/* Header Skeleton */}
    <div className="flex justify-between items-center bg-white/50 p-6 rounded-2xl border border-slate-100">
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <Skeleton className="h-10 w-32 rounded-full" />
    </div>

    {/* KPI Grid Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-32 rounded-2xl bg-white border border-slate-100 p-4 flex flex-col justify-between">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <Skeleton className="h-4 w-10 rounded-full" />
          </div>
          <div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>

    {/* Main Content Skeleton */}
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
      <div className="xl:col-span-2 space-y-6">
        <Skeleton className="h-[400px] w-full rounded-2xl" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
      </div>
      <div className="space-y-6">
        <Skeleton className="h-[350px] w-full rounded-2xl" />
        <Skeleton className="h-[350px] w-full rounded-2xl" />
      </div>
    </div>
  </div>
);

// 2. Premium KPI Card với Colored Shadow & Hover Effect
function PremiumStatCard({ label, value, icon: Icon, color, loading, highlight }) {
  const styles = {
    blue: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-100", shadow: "group-hover:shadow-blue-200/50" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", shadow: "group-hover:shadow-emerald-200/50" },
    violet: { bg: "bg-violet-50", text: "text-violet-600", border: "border-violet-100", shadow: "group-hover:shadow-violet-200/50" },
    orange: { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-100", shadow: "group-hover:shadow-orange-200/50" },
    cyan: { bg: "bg-cyan-50", text: "text-cyan-600", border: "border-cyan-100", shadow: "group-hover:shadow-cyan-200/50" },
    indigo: { bg: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", shadow: "group-hover:shadow-indigo-200/50" },
  };

  const s = styles[color] || styles.blue;

  return (
    <div className={`group relative overflow-hidden rounded-2xl border bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${s.shadow} ${highlight ? "border-indigo-200 ring-2 ring-indigo-50" : "border-slate-100"}`}>
      <div className="flex items-start justify-between relative z-10">
        <div className={`p-3 rounded-xl ${s.bg} ${s.text} transition-transform group-hover:scale-110`}>
          <Icon className="w-5 h-5" />
        </div>
        {highlight && (
          <span className="flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
        )}
      </div>

      <div className="mt-4 relative z-10">
        {loading ? (
          <Skeleton className="h-8 w-16 mb-1" />
        ) : (
          <p className="text-3xl font-extrabold text-slate-800 tracking-tight">{value ?? 0}</p>
        )}
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mt-1">{label}</p>
      </div>

      {/* Decorative Background Blob */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full ${s.bg} opacity-20 blur-2xl group-hover:opacity-40 transition-opacity`} />
    </div>
  );
}

// 3. Custom Tooltip cho Chart
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/90 backdrop-blur-md border border-slate-100 p-3 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-xs">
        <p className="font-semibold text-slate-500 mb-1 uppercase tracking-wider text-[10px]">{formatDate(label)}</p>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
          <span className="text-slate-600 font-medium">Ứng tuyển:</span>
          <span className="font-bold text-slate-900 text-lg">{payload[0].value}</span>
        </div>
      </div>
    );
  }
  return null;
};

// 4. Status Badge hiện đại
const PremiumBadge = ({ status, type, mini }) => {
  let styles = "bg-slate-100 text-slate-600 border-slate-200";
  let label = status;
  let icon = null;

  if (type === "job") {
    if (status === "active") { styles = "bg-emerald-50 text-emerald-700 border-emerald-100 ring-1 ring-emerald-500/10"; label = "Đang tuyển"; }
    else if (status === "closed") { styles = "bg-slate-100 text-slate-500 border-slate-200"; label = "Đã đóng"; }
    else if (status === "hidden") { styles = "bg-amber-50 text-amber-700 border-amber-100"; label = "Đang ẩn"; }
  } else if (type === "application") {
    if (status === "pending") { styles = "bg-sky-50 text-sky-700 border-sky-100"; label = "Chờ duyệt"; }
    else if (status === "interviewing") { styles = "bg-violet-50 text-violet-700 border-violet-100"; label = "Phỏng vấn"; }
    else if (status === "accepted") { styles = "bg-emerald-50 text-emerald-700 border-emerald-100"; label = "Đã nhận"; }
    else if (status === "rejected") { styles = "bg-rose-50 text-rose-700 border-rose-100"; label = "Từ chối"; }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wide transition-colors ${styles} ${mini ? 'px-2 py-0.5 text-[9px]' : ''}`}>
      {status === 'active' && <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></span>}
      {label}
    </span>
  );
};

// =========================
// Main Component Logic
// =========================
const FILTER_MODES = { QUICK: "quick", CUSTOM: "custom" };
const QUICK_RANGES = [
  { value: "7d", label: "7 ngày" },
  { value: "30d", label: "30 ngày" },
  { value: "all", label: "Tất cả" },
];
const DEFAULT_FILTERS = { range: "7d", from: "", to: "" };

export default function CompanyDashboard() {
  const [company, setCompany] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [filterMode, setFilterMode] = useState(FILTER_MODES.QUICK);
  const [filters, setFilters] = useState(DEFAULT_FILTERS);

  // Loading states
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState(null);

  // --- API Effects (Giữ nguyên logic của bạn) ---
  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoadingCompany(true);
        const res = await CompanyAPI.getMyCompany();
        setCompany(res.data?.data || null);
      } catch (err) {
        console.error("Failed to load company", err);
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

      const params = { topJobsLimit: 5, recentApplicationsLimit: 8, upcomingInterviewsLimit: 5 };
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
      setError("Không thể tải dữ liệu.");
    } finally {
      if (initial) setLoadingInitial(false);
      if (showChartLoader) setLoadingChart(false);
    }
  };

  useEffect(() => {
    if (company && company.status === "approved") {
      loadDashboard(DEFAULT_FILTERS, { initial: true });
    }
  }, [company]);

  // --- Handlers (Giữ nguyên) ---
  const handleModeChange = (mode) => {
    setFilterMode(mode);
    if (mode === FILTER_MODES.QUICK) {
      const resetFilters = { ...DEFAULT_FILTERS };
      setFilters(resetFilters);
      loadDashboard(resetFilters, { showChartLoader: true });
    } else {
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

  // --- Render Prep ---
  const kpis = dashboardData?.kpis || {};
  const chartData = dashboardData?.applicationTimeline?.points || [];
  const topJobs = dashboardData?.topJobs || [];
  const recentApplications = dashboardData?.recentApplications || [];
  const upcomingInterviews = dashboardData?.upcomingInterviews || [];
  const isGlobalLoading = loadingCompany || loadingInitial;

  // --- Early Returns (States) ---
  if (loadingCompany || (loadingInitial && !dashboardData)) return <div className="p-8 max-w-7xl mx-auto"><DashboardSkeleton /></div>;

  if (!company) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <Building2 className="w-10 h-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Chưa có hồ sơ công ty</h2>
        <p className="text-slate-500 mb-6 max-w-md mx-auto">Hãy tạo hồ sơ công ty chuyên nghiệp để bắt đầu đăng tin tuyển dụng và quản lý ứng viên.</p>
        <Button variant="primary" className="shadow-lg shadow-blue-500/30" onClick={() => navigate("/recruiter/company")}>Tạo hồ sơ ngay</Button>
      </div>
    );
  }

  if (company.status !== "approved") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in duration-500">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-amber-50/50">
          <Clock className="w-8 h-8 text-amber-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Đang chờ duyệt hồ sơ</h2>
        <p className="text-slate-500 max-w-md">Hồ sơ của bạn đang được đội ngũ Admin xem xét. Vui lòng quay lại sau.</p>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#F8F9FC] pb-20 font-sans">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

        {/* --- 1. GLASS HEADER --- */}
        <div className="sticky top-4 z-30 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
          <div className="flex items-center gap-4">
            {company.logo_url ? (
              <img src={company.logo_url} alt="" className="w-12 h-12 rounded-xl object-cover shadow-sm border border-slate-100" />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
                {company.name[0]}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Tổng quan tuyển dụng
                <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wider border border-slate-200">Dashboard</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Xin chào, quản trị viên của <span className="text-indigo-600 font-semibold">{company.name}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Server Time</span>
              <span className="text-xs font-mono font-semibold text-slate-700">{new Date().toLocaleTimeString('vi-VN')}</span>
            </div>
            <Button size="sm" variant="outline" className="rounded-xl border-slate-200 hover:bg-slate-50 hover:text-indigo-600">
              <Globe className="w-4 h-4 mr-2" /> Xem trang công ty
            </Button>
          </div>
        </div>

        {/* --- 2. ERROR BANNER --- */}
        {error && (
          <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <span className="text-sm text-rose-700 font-semibold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              {error}
            </span>
            <Button size="sm" variant="ghost" className="text-rose-600 hover:bg-rose-100" onClick={() => window.location.reload()}>Tải lại</Button>
          </div>
        )}

        {/* --- 3. PREMIUM KPI GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
          <PremiumStatCard
            label="Job đang tuyển"
            value={kpis.totalActiveJobs}
            icon={Briefcase}
            color="blue"
            loading={isGlobalLoading}
          />
          <PremiumStatCard
            label="Lượt xem Job"
            value={kpis.totalJobViews}
            icon={Flame}
            color="orange"
            loading={isGlobalLoading}
          />
          <PremiumStatCard
            label="Tổng ứng tuyển"
            value={kpis.totalApplications}
            icon={Users}
            color="emerald"
            loading={isGlobalLoading}
          />
          <PremiumStatCard
            label="Ứng viên mới (7d)"
            value={kpis.newCandidatesLast7Days}
            icon={TrendingUp}
            color="cyan"
            loading={isGlobalLoading}
            highlight
          />
          <PremiumStatCard
            label="Đơn mới (7d)"
            value={kpis.newApplicationsLast7Days}
            icon={FileClock}
            color="indigo"
            loading={isGlobalLoading}
            highlight
          />
          <PremiumStatCard
            label="Lịch phỏng vấn"
            value={kpis.upcomingInterviews}
            icon={CalendarRange}
            color="violet"
            loading={isGlobalLoading}
          />
        </div>

        {/* --- 4. MAIN CONTENT AREA --- */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* LEFT COLUMN: CHART & APPLICATIONS (Chiếm 2/3) */}
          <div className="xl:col-span-2 space-y-8">

            {/* Chart Section */}
            <Card className="shadow-sm border-slate-200/60 overflow-visible hover:shadow-md transition-shadow">
              <CardHeader
                className="border-b border-slate-100 pb-4"
                title={
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                      <BarChart3 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-800">Biểu đồ ứng tuyển</h3>
                      <p className="text-xs text-slate-400 font-medium">Theo dõi xu hướng nộp hồ sơ</p>
                    </div>
                  </div>
                }
              />
              <CardBody className="pt-6">
                {/* Filter Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-slate-50/50 p-2 rounded-xl border border-slate-100">
                  <div className="flex p-1 bg-white rounded-lg shadow-sm border border-slate-100">
                    {[FILTER_MODES.QUICK, FILTER_MODES.CUSTOM].map(mode => (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${filterMode === mode ? "bg-indigo-50 text-indigo-700 shadow-sm ring-1 ring-indigo-200" : "text-slate-500 hover:bg-slate-50"}`}
                      >
                        {mode === FILTER_MODES.QUICK ? "Chọn nhanh" : "Tùy chỉnh"}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 flex justify-end items-center gap-2">
                    {filterMode === FILTER_MODES.QUICK ? (
                      <div className="flex gap-2">
                        {QUICK_RANGES.map((item) => (
                          <button
                            key={item.value}
                            onClick={() => handleQuickRangeSelect(item.value)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${filters.range === item.value ? "bg-slate-800 text-white border-slate-800 shadow-lg shadow-slate-500/30" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 animate-in slide-in-from-right-2">
                        <div className="w-32"><DatePickerInput placeholderText="Từ ngày" name="from" value={filters.from} onChange={handleDateChange} className="!h-9 !text-xs !rounded-lg" /></div>
                        <span className="text-slate-300">/</span>
                        <div className="w-32"><DatePickerInput placeholderText="Đến ngày" name="to" value={filters.to} onChange={handleDateChange} className="!h-9 !text-xs !rounded-lg" /></div>
                        <Button size="sm" variant="primary" className="!h-9 !px-4 shadow-md shadow-indigo-500/20" disabled={!filters.from || !filters.to} onClick={handleApplyCustom}>Lọc</Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chart */}
                <div className="relative h-[320px] w-full">
                  {loadingChart && (
                    <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[2px] rounded-xl">
                      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                    </div>
                  )}

                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorAppsPremium" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} tickLine={false} axisLine={false} tickMargin={15} tickFormatter={formatDate} />
                        <YAxis tick={{ fontSize: 11, fill: "#94a3b8", fontWeight: 500 }} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          stroke="#6366f1"
                          strokeWidth={3}
                          fillOpacity={1}
                          fill="url(#colorAppsPremium)"
                          activeDot={{ r: 6, strokeWidth: 4, stroke: '#e0e7ff', fill: '#4f46e5' }}
                          animationDuration={1500}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState text="Không có dữ liệu trong khoảng thời gian này." />
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Recent Applications List */}
            <Card className="shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
              <CardHeader
                className="border-b border-slate-100 py-4 px-6"
                title="Ứng viên mới nhất"
                icon={<Sparkles className="w-4 h-4 text-amber-500" />}
                action={
                  <Button variant="ghost" size="sm" className="text-xs text-indigo-600 hover:bg-indigo-50">
                    Xem tất cả <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                }
              />
              <CardBody className="p-0">
                {recentApplications.length === 0 ? (
                  <div className="p-10"><EmptyState text="Chưa có ứng viên nào gần đây." /></div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {recentApplications.map((app) => {
                      // Logic lấy tên và avatar an toàn
                      const candidateName = app.candidate?.full_name || "Unknown";
                      // Giả định các trường avatar có thể có (tùy backend của bạn trả về)
                      const avatarUrl = app.candidate?.avatar || app.candidate?.avatar_url || app.candidate?.user?.avatar;

                      return (
                        <div key={app.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80 transition-colors group cursor-pointer">
                          <div className="flex items-center gap-4">
                            {/* --- AVATAR LOGIC --- */}
                            {avatarUrl ? (
                              <img
                                src={avatarUrl}
                                alt={candidateName}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-200">
                                {candidateName[0]?.toUpperCase()}
                              </div>
                            )}

                            <div>
                              <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                                {candidateName}
                              </p>
                              <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Vị trí: <span className="text-slate-700">{app.job?.title}</span>
                              </p>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-1">
                            <PremiumBadge status={app.status} type="application" mini />
                            <p className="text-[10px] text-slate-400 font-medium">
                              {formatDateTime(app.applied_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* RIGHT COLUMN: JOBS & INTERVIEWS (Chiếm 1/3) */}
          <div className="space-y-8">

            {/* Top Jobs */}
            <Card className="shadow-sm border-slate-200/60 h-fit hover:shadow-md transition-shadow">
              <CardHeader
                title="Top Job Hấp Dẫn"
                icon={<Flame className="w-4 h-4 text-orange-500" />}
                className="border-b border-slate-100 py-4 px-5"
              />
              <CardBody className="p-0">
                {topJobs.length === 0 ? (
                  <div className="p-6"><EmptyState text="Chưa có dữ liệu." /></div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {topJobs.map((job, idx) => (
                      <div key={job.id} className="p-4 px-5 hover:bg-slate-50 transition-colors group">
                        <div className="flex justify-between items-start mb-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>#{idx + 1}</span>
                          <PremiumBadge status={job.status} type="job" mini />
                        </div>
                        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 mb-3 group-hover:text-indigo-600 transition-colors" title={job.title}>
                          {job.title}
                        </h3>

                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Users className="w-3.5 h-3.5 text-blue-500" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800">{job._count?.applications || 0}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Đơn</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            <Globe className="w-3.5 h-3.5 text-emerald-500" />
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-slate-800">{job.views_count || 0}</span>
                              <span className="text-[9px] text-slate-400 font-bold uppercase">Xem</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Interviews */}
            <Card className="shadow-sm border-slate-200/60 h-fit hover:shadow-md transition-shadow bg-gradient-to-b from-white to-violet-50/30">
              <CardHeader
                title="Lịch Phỏng Vấn"
                icon={<Clock className="w-4 h-4 text-violet-600" />}
                className="border-b border-slate-100 py-4 px-5"
              />
              <CardBody className="p-0">
                {upcomingInterviews.length === 0 ? (
                  <div className="p-6"><EmptyState text="Không có lịch phỏng vấn sắp tới." /></div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {upcomingInterviews.map((item) => {
                      const cName = item.application?.candidate?.user?.full_name || item.candidate?.full_name;
                      const jTitle = item.application?.job?.title || item.job?.title;
                      const dateObj = new Date(item.scheduled_at);

                      return (
                        <div key={item.id} className="p-4 px-5 flex gap-4 hover:bg-white transition-colors border-l-2 border-transparent hover:border-violet-500">
                          <div className="flex-shrink-0 flex flex-col items-center justify-center w-12 h-14 bg-white text-violet-700 rounded-xl border border-violet-100 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-violet-400">{dateObj.toLocaleDateString('en-US', { month: 'short' })}</span>
                            <span className="text-xl font-extrabold leading-none mt-0.5">{dateObj.getDate()}</span>
                          </div>
                          <div className="overflow-hidden flex-1">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-slate-800 truncate">{cName}</p>
                              <span className="text-[10px] font-bold bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                                {dateObj.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mb-2">{jTitle}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${item.mode === 'online' ? 'bg-sky-50 text-sky-700 border-sky-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                              {item.mode === 'online' ? '● Online' : '● Offline'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardBody>
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl">
                <Button variant="ghost" className="w-full text-xs text-violet-600 justify-center h-8 hover:bg-violet-100">Xem tất cả lịch <ChevronRight className="w-3 h-3 ml-1" /></Button>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}