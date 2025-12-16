import { useEffect, useMemo, useState } from "react";
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    ShoppingCart,
    XCircle,
    Users,
    Building2,
    BriefcaseBusiness,
    RefreshCcw,
    CalendarRange,
    Filter,
} from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from "recharts";

import AdminDashboardAPI from "../AdminDashboardAPI";

// Import components UI
import { Card, CardHeader, CardBody } from "@/components/common/Card";
import Button from "@/components/ui/Button";
import SelectInput from "@/components/ui/SelectInput";
import DatePickerInput from "@/components/ui/DatePickerInput";
import EmptyState from "@/components/common/EmptyState";

// ===========================
// Helpers
// ===========================
const nf = new Intl.NumberFormat("vi-VN");
const formatVnd = (n) => `${nf.format(Number(n || 0))} ₫`;
const formatInt = (n) => nf.format(Number(n || 0));

// ===========================
// 1. Premium Components: Skeleton & Sparkline
// ===========================

// Skeleton: Hiệu ứng loading mượt mà
const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-slate-200/80 rounded-lg ${className}`} />
);

const DashboardSkeleton = () => (
    <div className="space-y-6 animate-in fade-in duration-700">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-32" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-10 w-10" />
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="h-40 p-5 relative overflow-hidden border-slate-100">
                    <div className="flex justify-between">
                        <Skeleton className="h-12 w-12 rounded-2xl" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                    <div className="mt-6 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-40" />
                    </div>
                    {/* Fake sparkline bottom */}
                    <Skeleton className="absolute bottom-0 left-0 right-0 h-12 w-full opacity-20" />
                </Card>
            ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 h-[400px]">
            <Card className="xl:col-span-2 p-6"><Skeleton className="w-full h-full rounded-xl" /></Card>
            <Card className="p-6"><Skeleton className="w-full h-full rounded-xl" /></Card>
        </div>
    </div>
);

// Custom Tooltip xịn sò
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-3 border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-xl text-xs z-50">
                <p className="font-semibold text-slate-700 mb-1">{label}</p>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <p className="text-slate-900 font-bold text-sm font-mono">
                        {payload[0].name === "value" // Logic detect loại biểu đồ
                            ? formatVnd(payload[0].value)
                            : formatInt(payload[0].value)}
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

// KPI Card với Sparkline (Biểu đồ nhỏ chạy nền)
function PremiumKpiCard({ title, value, subtitle, icon, tone = "blue", trend, sparklineData = [] }) {
    const styles = {
        blue: { bg: "bg-blue-50", text: "text-blue-600", stroke: "#2563eb", fill: "#3b82f6", shadow: "shadow-blue-200/50" },
        emerald: { bg: "bg-emerald-50", text: "text-emerald-600", stroke: "#059669", fill: "#10b981", shadow: "shadow-emerald-200/50" },
        amber: { bg: "bg-amber-50", text: "text-amber-600", stroke: "#d97706", fill: "#f59e0b", shadow: "shadow-amber-200/50" },
        rose: { bg: "bg-rose-50", text: "text-rose-600", stroke: "#e11d48", fill: "#f43f5e", shadow: "shadow-rose-200/50" },
        violet: { bg: "bg-violet-50", text: "text-violet-600", stroke: "#7c3aed", fill: "#8b5cf6", shadow: "shadow-violet-200/50" },
        slate: { bg: "bg-slate-50", text: "text-slate-600", stroke: "#475569", fill: "#64748b", shadow: "shadow-slate-200/50" },
    };

    const s = styles[tone] || styles.blue;

    // Tạo dữ liệu giả lập cho sparkline nếu API không trả về, để đảm bảo độ đẹp
    const chartData = sparklineData.length > 0
        ? sparklineData
        : [4, 3, 5, 4, 6, 5, 8, 7, 9, 8].map((v) => ({ val: v }));

    return (
        <Card className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border-slate-100 group ${s.shadow}`}>
            <CardBody className="p-5 relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <div className={`p-2.5 rounded-xl ${s.bg} ${s.text} bg-opacity-60 backdrop-blur-sm border border-white/50 shadow-sm`}>
                        {icon}
                    </div>
                    {trend && (
                        <div className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${trend.up ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            {trend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {trend.val}%
                        </div>
                    )}
                </div>

                <div className="mt-3">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{title}</p>
                    <p className="mt-1 text-2xl font-extrabold text-slate-900 tracking-tight">{value}</p>
                    {subtitle && <p className="text-xs text-slate-400 font-medium truncate mt-0.5 opacity-80">{subtitle}</p>}
                </div>
            </CardBody>

            {/* Sparkline Chart Background */}
            <div className="absolute -bottom-1 -left-1 -right-1 h-16 opacity-20 group-hover:opacity-30 transition-opacity duration-500 mask-image-gradient">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                        <defs>
                            <linearGradient id={`grad-${tone}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={s.fill} stopOpacity={0.6} />
                                <stop offset="100%" stopColor={s.fill} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <Area
                            type="monotone"
                            dataKey={sparklineData.length ? "value" : "val"}
                            stroke={s.stroke}
                            strokeWidth={2}
                            fill={`url(#grad-${tone})`}
                            isAnimationActive={false}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

// Biểu đồ chính với Gradient đẹp
function RevenueAreaChart({ points = [] }) {
    const data = points.map((p) => ({ name: p.label, value: Number(p.value || 0) }));

    return (
        <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorRevenuePremium" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 500 }}
                        tickFormatter={(value) => value >= 1000000 ? `${value / 1000000}M` : value}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#64748b", strokeWidth: 1, strokeDasharray: "4 4" }} />
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke="#2563eb"
                        strokeWidth={3}
                        fill="url(#colorRevenuePremium)"
                        activeDot={{ r: 6, strokeWidth: 4, stroke: "#dbeafe", fill: "#2563eb" }}
                        animationDuration={1500}
                        animationEasing="ease-out"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

// Pie Chart gọn gàng
function StatusPieChart({ data }) {
    const chartData = [
        { name: "Paid", value: data?.paid ?? 0, color: "#10b981" },
        { name: "Pending", value: data?.pending ?? 0, color: "#f59e0b" },
        { name: "Failed", value: data?.failed ?? 0, color: "#ef4444" },
        { name: "Expired", value: data?.expired ?? 0, color: "#64748b" },
        { name: "Cancelled", value: data?.cancelled ?? 0, color: "#a855f7" },
    ].filter(item => item.value > 0);

    if (chartData.length === 0) return <EmptyState text="Chưa có dữ liệu" />;

    return (
        <div className="h-[320px] w-full flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={95}
                        paddingAngle={4}
                        dataKey="value"
                        cornerRadius={6}
                        stroke="none"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Pie>
                    <Tooltip
                        formatter={(value) => formatInt(value)}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontWeight: 600, color: '#334155' }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-slate-600 font-medium text-xs ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
            {/* Center Text Trick */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                <p className="text-xs text-slate-400 font-medium">Total</p>
                <p className="text-xl font-bold text-slate-800">
                    {formatInt(chartData.reduce((a, b) => a + b.value, 0))}
                </p>
            </div>
        </div>
    );
}

function TopPlansTable({ items = [] }) {
    if (!items.length) return <div className="p-10"><EmptyState text="Chưa có dữ liệu" /></div>;
    const maxRevenue = Math.max(1, ...items.map((x) => Number(x.revenue || 0)));

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider backdrop-blur">
                    <tr>
                        <th className="px-6 py-4 border-b border-slate-100">Gói (Plan)</th>
                        <th className="px-6 py-4 border-b border-slate-100">Lượt mua</th>
                        <th className="px-6 py-4 border-b border-slate-100">Doanh thu</th>
                        <th className="px-6 py-4 border-b border-slate-100 w-[30%]">Tỉ trọng</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {items.map((x, idx) => {
                        const pct = Math.max(0, Math.min(100, (Number(x.revenue || 0) / maxRevenue) * 100));
                        return (
                            <tr key={x.plan_id} className="group hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${idx === 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600 group-hover:bg-white group-hover:shadow-sm'}`}>
                                            #{idx + 1}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{x.plan_name}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">ID: {x.plan_id}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-semibold text-slate-700">{formatInt(x.purchases)}</td>
                                <td className="px-6 py-4 font-bold text-emerald-600">{formatVnd(x.revenue)}</td>
                                <td className="px-6 py-4">
                                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ===========================
// Main Page Logic
// ===========================
export default function AdminDashboardPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [payload, setPayload] = useState(null);

    const [filter, setFilter] = useState({
        range: "30d",
        from: "",
        to: "",
    });

    const rangeOptions = useMemo(
        () => [
            { value: "7d", label: "7 ngày qua" },
            { value: "30d", label: "30 ngày qua" },
            { value: "3m", label: "3 tháng qua" },
            { value: "1y", label: "1 năm qua" },
            { value: "custom", label: "Tuỳ chọn" },
        ],
        []
    );

    const queryParams = useMemo(() => {
        if (filter.range === "custom") {
            const params = {};
            if (filter.from) params.from = filter.from;
            if (filter.to) params.to = filter.to;
            return params;
        }
        return { range: filter.range };
    }, [filter]);

    const fetchDashboard = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await AdminDashboardAPI.getDashboard(queryParams);
            const body = res?.data ?? res;
            if (body?.success === false) {
                throw new Error(body?.message || "Load dashboard failed");
            }
            setPayload(body);
        } catch (e) {
            setError(e?.response?.data?.message || e?.message || "Có lỗi xảy ra");
        } finally {
            // Delay giả lập 0.5s để user kịp thấy hiệu ứng Skeleton đẹp mắt (optional)
            setTimeout(() => setLoading(false), 300);
        }
    };

    useEffect(() => {
        fetchDashboard();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(queryParams)]);

    // Render Skeleton khi đang load data lần đầu
    if (loading && !payload) {
        return <DashboardSkeleton />;
    }

    const data = payload?.data;
    const kpis = data?.kpis;
    const charts = data?.charts;

    const mom = Number(kpis?.revenueMoMPercent ?? 0);
    const momUp = mom >= 0;

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

            {/* Glass Header */}
            <Card className="border-none shadow-sm bg-white/80 backdrop-blur-xl sticky top-0 z-20 border-b border-slate-200/60">
                <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 font-medium">
                            <CalendarRange className="w-4 h-4 text-slate-400" />
                            {data?.range ? `${data.range.from} - ${data.range.to}` : "Tổng quan hệ thống"}
                            {payload?.timestamp && <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-bold uppercase">Live</span>}
                        </p>
                    </div>

                    {/* Filter Tools */}
                    <div className="flex flex-wrap items-end gap-3">
                        <div className="w-[160px]">
                            <SelectInput
                                label="Thời gian"
                                value={filter.range}
                                onChange={(e) => setFilter((p) => ({ ...p, range: e.target.value }))}
                                options={rangeOptions}
                                disabled={loading}
                            />
                        </div>
                        {filter.range === 'custom' && (
                            <>
                                <div className="w-[140px]">
                                    <DatePickerInput
                                        label="Từ ngày"
                                        value={filter.from}
                                        onChange={(e) => setFilter((p) => ({ ...p, from: e.target.value }))}
                                        maxDate={filter.to ? new Date(filter.to) : undefined}
                                    />
                                </div>
                                <div className="w-[140px]">
                                    <DatePickerInput
                                        label="Đến ngày"
                                        value={filter.to}
                                        onChange={(e) => setFilter((p) => ({ ...p, to: e.target.value }))}
                                        minDate={filter.from ? new Date(filter.from) : undefined}
                                    />
                                </div>
                            </>
                        )}
                        <Button
                            variant="primary"
                            onClick={fetchDashboard}
                            disabled={loading}
                            className="mb-[2px] h-[42px] px-6 shadow-blue-500/20 shadow-lg hover:shadow-blue-500/40 transition-all"
                        >
                            {loading ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="px-6 py-3 bg-rose-50 border-t border-rose-100 animate-in slide-in-from-top-2">
                        <p className="text-sm text-rose-600 font-medium flex items-center gap-2">
                            <XCircle className="w-4 h-4" /> {error}
                        </p>
                    </div>
                )}
            </Card>

            {/* KPI Cards với Sparklines */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <PremiumKpiCard
                    title="Tổng Doanh Thu"
                    value={formatVnd(kpis?.totalRevenueAllTime)}
                    subtitle="All-time revenue"
                    icon={<DollarSign className="w-5 h-5" />}
                    tone="emerald"
                    // Truyền data thực tế vào sparkline
                    sparklineData={charts?.revenueTimeline?.points}
                />
                <PremiumKpiCard
                    title="Doanh Thu Tháng"
                    value={formatVnd(kpis?.revenueThisMonth)}
                    subtitle="So với tháng trước"
                    icon={<TrendingUp className="w-5 h-5" />}
                    tone={momUp ? "blue" : "rose"}
                    trend={{ up: momUp, val: Math.abs(mom) }}
                // Nếu không có data lịch sử tháng, component sẽ tự sinh data giả cho đẹp
                />
                <PremiumKpiCard
                    title="Đơn Thành Công"
                    value={formatInt(kpis?.paidOrdersCount)}
                    subtitle={`Lỗi/Hết hạn: ${formatInt(kpis?.failedOrExpiredCount)}`}
                    icon={<ShoppingCart className="w-5 h-5" />}
                    tone="violet"
                />
                <PremiumKpiCard
                    title="Nhà Tuyển Dụng"
                    value={formatInt(kpis?.payingRecruitersCount)}
                    subtitle="Đang active gói"
                    icon={<Users className="w-5 h-5" />}
                    tone="amber"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Revenue Chart */}
                <Card className="xl:col-span-2 flex flex-col h-full shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
                    <CardHeader
                        title="Biểu Đồ Doanh Thu"
                        icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                        action={<span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 uppercase tracking-wide">{charts?.revenueTimeline?.bucket || 'Day'}</span>}
                    />
                    <CardBody className="flex-1 min-h-[350px] p-6">
                        {charts?.revenueTimeline?.points?.length ? (
                            <RevenueAreaChart points={charts.revenueTimeline.points} />
                        ) : (
                            <div className="h-full flex items-center justify-center">
                                <EmptyState text="Chưa có dữ liệu doanh thu" />
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* Status Chart */}
                <Card className="flex flex-col h-full shadow-sm border-slate-200/60 hover:shadow-md transition-shadow">
                    <CardHeader
                        title="Tỉ Lệ Đơn Hàng"
                        icon={<Filter className="w-5 h-5 text-violet-600" />}
                    />
                    <CardBody className="flex-1 min-h-[350px] p-6 flex flex-col justify-center">
                        {charts?.orderStatus?.data ? (
                            <StatusPieChart data={charts.orderStatus.data} />
                        ) : (
                            <EmptyState text="Chưa có dữ liệu" />
                        )}
                    </CardBody>
                </Card>
            </div>

            {/* Secondary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <PremiumKpiCard
                    title="Công ty chờ duyệt"
                    value={formatInt(kpis?.pendingCompaniesCount)}
                    subtitle="Cần review hồ sơ"
                    icon={<Building2 className="w-5 h-5" />}
                    tone="slate"
                />
                <PremiumKpiCard
                    title="Tin đăng active"
                    value={formatInt(kpis?.activeJobsCount)}
                    subtitle="Đang hiển thị trên sàn"
                    icon={<BriefcaseBusiness className="w-5 h-5" />}
                    tone="blue"
                />
                <PremiumKpiCard
                    title="Giao dịch thất bại"
                    value={formatInt(kpis?.failedOrExpiredCount)}
                    subtitle="Cần kiểm tra log"
                    icon={<XCircle className="w-5 h-5" />}
                    tone="rose"
                />
            </div>

            {/* Top Plans Table */}
            <Card className="overflow-hidden shadow-sm border-slate-200/60">
                <CardHeader
                    title="Top Gói Dịch Vụ"
                    icon={<DollarSign className="w-5 h-5 text-emerald-600" />}
                />
                <TopPlansTable items={charts?.topPlans || []} />
            </Card>
        </div>
    );
}