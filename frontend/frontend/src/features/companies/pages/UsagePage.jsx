import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Briefcase,
    Sparkles,
    Crown,
    RefreshCcw,
    Building2,
    ShieldCheck,
    AlertTriangle,
    ArrowUpRight,
    CheckCircle2,
    Clock,
    Zap
} from "lucide-react";

import CompanyPlanAPI from "../CompanyPlanAPI";
import CompanyAPI from "../CompanyAPI";
import Button from "@/components/ui/button";
import { Card, CardHeader, CardBody, CardFooter } from "@/components/common/Card";
import EmptyState from "@/components/common/EmptyState";
import SectionHeader from "@/components/common/SectionHeader";
import TagList from "@/components/common/TagList";

// --- HELPER FUNCTIONS ---
function safeNumber(n, fallback = 0) {
    const x = Number(n);
    return Number.isFinite(x) ? x : fallback;
}
function clampPercent(p) {
    if (!Number.isFinite(p)) return 0;
    return Math.max(0, Math.min(100, p));
}
function formatVND(v) {
    const num = safeNumber(v, NaN);
    if (!Number.isFinite(num)) return v ?? "—";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
}
function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? "—" : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(d);
}
function getDaysDiff(start, end) {
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s) || isNaN(e)) return 0;
    return Math.ceil((e - s) / (1000 * 60 * 60 * 24));
}

// --- MICRO COMPONENTS ---

// 1. Biểu đồ tròn hiển thị phần trăm sử dụng
const CircularProgress = ({ value, total, color = "text-blue-600", icon: Icon }) => {
    const percent = total > 0 ? clampPercent((value / total) * 100) : 0;
    const radius = 30;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center w-24 h-24">
            <svg className="transform -rotate-90 w-full h-full">
                <circle
                    className="text-slate-100"
                    strokeWidth="6"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                />
                <circle
                    className={`${color} transition-all duration-1000 ease-out`}
                    strokeWidth="6"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx="50%"
                    cy="50%"
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                {Icon && <Icon className="w-6 h-6" />}
            </div>
        </div>
    );
};

// 2. Card hiển thị Metric (Job/Credit)
const StatCard = ({ title, subtitle, used, total, remaining, unit, icon, tone = "blue" }) => {
    const isWarning = remaining / total < 0.2; // < 20%

    // Config màu sắc
    const colors = {
        blue: { text: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
        emerald: { text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
        amber: { text: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
        rose: { text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-100" },
    };

    // Tự động chuyển sang màu đỏ/cam nếu sắp hết
    const activeTone = isWarning ? "amber" : tone;
    const theme = colors[activeTone] || colors.blue;

    return (
        <Card className="h-full border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <CardBody className="p-5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-base font-bold text-slate-700 flex items-center gap-2">
                            <span className={`p-1.5 rounded-lg ${theme.bg} ${theme.text}`}>{icon}</span>
                            {title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Visual Chart */}
                    <CircularProgress
                        value={used}
                        total={total}
                        color={theme.text}
                        icon={isWarning ? AlertTriangle : CheckCircle2}
                    />

                    {/* Numbers */}
                    <div className="flex-1 space-y-1">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Còn lại</p>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-extrabold ${theme.text}`}>{remaining}</span>
                            <span className="text-sm text-slate-500 font-medium">/ {total} {unit}</span>
                        </div>

                        {/* Small progress text */}
                        <div className="text-xs text-slate-500 mt-2 flex items-center justify-between bg-slate-50 p-2 rounded-md border border-slate-100">
                            <span>Đã dùng: <strong>{used}</strong></span>
                            <span>({clampPercent((used / total) * 100).toFixed(0)}%)</span>
                        </div>
                    </div>
                </div>
            </CardBody>
        </Card>
    );
};

// 3. Thanh hiển thị thời gian gói
const TimeUsage = ({ start, end, daysLeft }) => {
    const now = new Date();
    const startDate = new Date(start);
    const endDate = new Date(end);
    const totalDays = getDaysDiff(startDate, endDate);
    const passedDays = getDaysDiff(startDate, now);
    const percentTime = clampPercent((passedDays / totalDays) * 100);

    const isUrgent = daysLeft <= 5;

    return (
        <div className="space-y-3">
            <div className="flex justify-between items-end">
                <div className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    Thời hạn sử dụng
                </div>
                <div className={`text-sm font-bold ${isUrgent ? 'text-rose-600' : 'text-slate-900'}`}>
                    {daysLeft > 0 ? `Còn ${daysLeft} ngày` : "Đã hết hạn"}
                </div>
            </div>

            {/* Custom Progress Bar */}
            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${isUrgent ? 'bg-rose-500' : 'bg-slate-600'}`}
                    style={{ width: `${percentTime}%` }}
                />
            </div>

            <div className="flex justify-between text-xs text-slate-400 font-medium">
                <span>{formatDateTime(start)}</span>
                <span>{formatDateTime(end)}</span>
            </div>
        </div>
    );
}

// --- MAIN COMPONENT ---
export default function Usage() {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const [company, setCompany] = useState(null);
    const [summary, setSummary] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    const load = async ({ isRefresh = false } = {}) => {
        try {
            isRefresh ? setRefreshing(true) : setLoading(true);
            setError("");

            const companyRes = await CompanyAPI.getMyCompany();
            const c = companyRes?.data?.data ?? companyRes?.data ?? null;
            setCompany(c);

            if (!c || String(c.status || "").toLowerCase() !== "approved") {
                setSummary(null);
                return;
            }

            const res = await CompanyPlanAPI.getCurrentSummary();
            const raw = res?.data?.data ?? null;
            setLastUpdated(raw?.timestamp ?? null);
            setSummary(raw);
        } catch (e) {
            setError(e?.message || "Có lỗi xảy ra");
            setSummary(null);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => { load(); }, []);

    const plan = summary?.current_plan || null;
    const quota = summary?.quota || null;

    const computed = useMemo(() => {
        const now = new Date();
        const start = plan?.start_date ? new Date(plan.start_date) : null;
        const end = plan?.end_date ? new Date(plan.end_date) : null;
        const msLeft = end ? end.getTime() - now.getTime() : 0;
        const daysLeft = msLeft > 0 ? Math.ceil(msLeft / 86400000) : 0;

        const jobsTotal = safeNumber(quota?.jobs?.total, 0);
        const jobsUsed = safeNumber(quota?.jobs?.used, 0);
        const jobsRemaining = safeNumber(quota?.jobs?.remaining, 0);

        const creditsTotal = safeNumber(quota?.credits?.total, 0);
        const creditsRemaining = safeNumber(quota?.credits?.remaining, 0);
        const creditsUsed = Math.max(0, creditsTotal - creditsRemaining);

        return { start, end, daysLeft, jobsTotal, jobsUsed, jobsRemaining, creditsTotal, creditsUsed, creditsRemaining };
    }, [plan, quota]);

    // UI States rendering
    if (loading) return <SkeletonLoader />;

    // Case 1: No Company
    if (!company) return (
        <CenteredMessage
            icon={<Building2 className="w-10 h-10 text-slate-300" />}
            title="Chưa có hồ sơ công ty"
            desc="Bạn cần tạo hồ sơ công ty trước khi sử dụng dịch vụ."
            action={<Button onClick={() => navigate("/recruiter/company/create")}>Tạo công ty ngay</Button>}
        />
    );

    // Case 2: Not Approved
    if (String(company?.status || "").toLowerCase() !== "approved") return (
        <CenteredMessage
            icon={<ShieldCheck className="w-10 h-10 text-amber-300" />}
            title="Đang chờ duyệt"
            desc="Hồ sơ công ty của bạn đang được xét duyệt. Vui lòng quay lại sau."
        />
    );

    // Case 3: No Plan
    if (!plan) return (
        <CenteredMessage
            icon={<Crown className="w-10 h-10 text-indigo-300" />}
            title="Chưa đăng ký gói"
            desc="Hãy chọn một gói dịch vụ phù hợp để bắt đầu tuyển dụng nhân tài."
            action={
                <Button variant="primary" onClick={() => navigate("/recruiter/upgrade-plan")}>
                    Xem các gói dịch vụ
                </Button>
            }
        />
    );

    // Case 4: Main Dashboard
    return (
        <div className="min-h-screen bg-slate-50/50 pb-10">
            <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">

                {/* 1. Header Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Usage & Quota</h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Quản lý tài nguyên tuyển dụng của <span className="font-semibold text-slate-700">{company.name}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {lastUpdated && (
                            <span className="text-xs text-slate-400 mr-2 hidden sm:inline">
                                Cập nhật: {formatDateTime(lastUpdated)}
                            </span>
                        )}
                        <Button variant="outline" size="sm" onClick={() => load({ isRefresh: true })} disabled={refreshing}>
                            <RefreshCcw className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
                            Refresh
                        </Button>
                        <Button variant="primary" size="sm" onClick={() => navigate("/recruiter/upgrade-plan")}>
                            <Zap className="w-4 h-4 mr-2" />
                            Nâng cấp
                        </Button>
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5" />
                        <span>{error}</span>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* 2. Left Column: Usage Metrics (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Jobs Metric */}
                            <StatCard
                                icon={<Briefcase className="w-4 h-4" />}
                                title="Quota Job"
                                subtitle="Số lượng tin đăng được phép"
                                total={computed.jobsTotal}
                                used={computed.jobsUsed}
                                remaining={computed.jobsRemaining}
                                unit="tin"
                                tone="blue"
                            />
                            {/* Credits Metric */}
                            <StatCard
                                icon={<Sparkles className="w-4 h-4" />}
                                title="Credits"
                                subtitle="Dùng để đẩy tin / xem CV"
                                total={computed.creditsTotal}
                                used={computed.creditsUsed}
                                remaining={computed.creditsRemaining}
                                unit="điểm"
                                tone="emerald"
                            />
                        </div>

                        {/* Feature List (Optional - moved here or keep on right) */}
                        <Card className="overflow-hidden border border-slate-200 shadow-sm">
                            <CardHeader title="Quyền lợi chi tiết gói hiện tại" icon={<CheckCircle2 className="w-5 h-5 text-indigo-500" />} />
                            <CardBody>
                                <div className="prose prose-sm prose-slate max-w-none 
                                    prose-p:my-1 prose-ul:my-2 prose-li:my-0.5 prose-strong:text-indigo-900"
                                    dangerouslySetInnerHTML={{ __html: plan.features || "<p class='text-slate-400 italic'>Chưa có thông tin chi tiết.</p>" }}
                                />
                            </CardBody>
                        </Card>
                    </div>

                    {/* 3. Right Column: Plan Info (1/3 width) */}
                    <div className="space-y-6">
                        {/* Plan Ticket */}
                        <div className="bg-white rounded-2xl border border-indigo-100 shadow-lg shadow-indigo-500/5 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <Crown className="w-24 h-24 text-indigo-600" />
                            </div>

                            <div className="p-6 relative z-10">
                                <div className="flex items-center gap-2 mb-2">
                                    <TagList color="indigo" items={["Current Plan"]} />
                                </div>
                                <h2 className="text-2xl font-black text-slate-900">{plan.name}</h2>
                                <p className="text-slate-500 font-medium text-sm mt-1 mb-6">
                                    {formatVND(plan.price)} <span className="font-normal text-slate-400">/ tháng</span>
                                </p>

                                <hr className="border-dashed border-slate-200 my-4" />

                                <TimeUsage start={computed.start} end={computed.end} daysLeft={computed.daysLeft} />
                            </div>

                            <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-center">
                                <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 w-full" onClick={() => navigate("/recruiter/upgrade-plan")}>
                                    Đổi sang gói khác <ArrowUpRight className="w-4 h-4 ml-1" />
                                </Button>
                            </div>
                        </div>

                        {/* Quick Action Helper */}
                        <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-lg">
                            <h3 className="font-bold text-lg mb-1">Cần thêm Quota?</h3>
                            <p className="text-indigo-100 text-sm mb-3">Nâng cấp gói ngay để không gián đoạn tuyển dụng.</p>
                            <Button className="w-full bg-white text-indigo-700 hover:bg-indigo-50 border-0" onClick={() => navigate("/recruiter/upgrade-plan")}>
                                Nâng cấp ngay
                            </Button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// --- SUB COMPONENTS FOR STATES ---

function SkeletonLoader() {
    return (
        <div className="max-w-6xl mx-auto p-6 space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-2 gap-4">
                    <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
                    <div className="h-40 bg-slate-200 rounded-xl animate-pulse" />
                </div>
                <div className="h-80 bg-slate-200 rounded-xl animate-pulse" />
            </div>
        </div>
    );
}

function CenteredMessage({ icon, title, desc, action }) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="p-4 bg-slate-50 rounded-full mb-4 border border-slate-100">{icon}</div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{title}</h2>
            <p className="text-slate-500 max-w-md mb-6">{desc}</p>
            {action}
        </div>
    );
}