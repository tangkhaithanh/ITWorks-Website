import { useEffect, useMemo, useState } from "react";
import {
    Search,
    ChevronLeft,
    ChevronRight,
    FileText,
    Receipt,
    Copy,
    Check,
    Calendar,
    Filter,
    CreditCard,
} from "lucide-react";

import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
// import SelectInput from "@/components/ui/SelectInput"; // Tạm thời không dùng, thay bằng Quick Tabs

import PaymentAPI from "../PaymentAPI";
import CompanyAPI from "../../companies/CompanyAPI";

const PAGE_SIZE = 10;

// ==========================
// HELPERS
// ==========================
const getPaymentStatusStyle = (status) => {
    switch (status) {
        case "paid":
            return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
        case "pending":
            return "bg-amber-50 text-amber-700 ring-amber-600/20";
        case "failed":
            return "bg-rose-50 text-rose-700 ring-rose-600/20";
        case "expired":
        case "cancelled":
            return "bg-slate-100 text-slate-600 ring-slate-500/20";
        default:
            return "bg-gray-50 text-gray-600 ring-gray-500/20";
    }
};

const getStatusLabel = (status) => {
    const map = {
        paid: "Đã thanh toán",
        pending: "Đang chờ",
        failed: "Thất bại",
        expired: "Hết hạn",
        cancelled: "Đã hủy",
    };
    return map[status] || status || "—";
};

const StatusBadge = ({ status }) => {
    const style = getPaymentStatusStyle(status);
    const label = getStatusLabel(status);

    return (
        <span
            className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ring-1 ring-inset ${style}`}
        >
            {status === "paid" && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            )}
            {label}
        </span>
    );
};

const formatVnd = (value) => {
    if (value === null || value === undefined) return "—";
    const n = Number(value);
    if (Number.isNaN(n)) return String(value);
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    }).format(n);
};

const formatDateTime = (value) => {
    if (!value) return "—";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "—";
    // Format gọn hơn: 14:30, 20/12/2024
    return d.toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

// ==========================
// SUB-COMPONENTS
// ==========================

// Nút Copy có phản hồi UX
const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        if (!text) return;
        try {
            await navigator.clipboard.writeText(String(text));
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (e) {
            console.error("Copy failed", e);
        }
    };

    return (
        <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-100 rounded-md text-slate-400 hover:text-indigo-600 transition-colors"
            title="Sao chép mã đơn"
        >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
    );
};

// Tabs lọc trạng thái nhanh
const StatusFilterTabs = ({ current, onChange }) => {
    const tabs = [
        { id: "", label: "Tất cả" },
        { id: "paid", label: "Đã thanh toán" },
        { id: "pending", label: "Đang chờ" },
        { id: "failed", label: "Thất bại/Hủy" }, // Gom nhóm cho gọn nếu muốn
    ];

    return (
        <div className="flex items-center gap-1 p-1 bg-slate-100/80 rounded-lg w-full md:w-auto overflow-x-auto no-scrollbar">
            {tabs.map((tab) => {
                const isActive = current === tab.id;
                // Xử lý logic hiển thị tab active
                return (
                    <button
                        key={tab.id || "all"}
                        onClick={() => onChange(tab.id)}
                        className={`
                            px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all
                            ${isActive
                                ? "bg-white text-indigo-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            }
                        `}
                    >
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
};

// ==========================
// PAGE COMPONENT
// ==========================
export default function ManageOrderPage() {
    const [filters, setFilters] = useState({
        keyword: "",
        status: "",
    });

    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const [company, setCompany] = useState(null);
    const [checkingAccess, setCheckingAccess] = useState(true);

    const limit = PAGE_SIZE;
    const totalPages = useMemo(
        () => Math.max(1, Math.ceil(total / limit)),
        [total, limit]
    );

    // --- API Calls (Giữ nguyên logic của bạn) ---
    useEffect(() => {
        const checkAccess = async () => {
            try {
                setCheckingAccess(true);
                const companyRes = await CompanyAPI.getMyCompany();
                setCompany(companyRes.data?.data || null);
            } catch (err) {
                console.error("Lỗi access:", err);
                setCompany(null);
            } finally {
                setCheckingAccess(false);
            }
        };
        checkAccess();
    }, []);

    const fetchData = async (params = {}) => {
        try {
            setLoading(true);
            const currentPage = params.page || page || 1;
            const res = await PaymentAPI.getOrders({
                page: currentPage,
                limit,
                keyword: filters.keyword || undefined,
                status: filters.status || undefined,
                ...params,
            });
            const payload = res.data?.data || res.data || {};
            setOrders(payload.data || []);
            setTotal(Number(payload.meta?.total || 0));
            setPage(Number(payload.meta?.page || currentPage));
        } catch (err) {
            console.error("Lỗi fetch:", err);
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!checkingAccess && company?.status === "approved") {
            fetchData({ page: 1 });
            setPage(1);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkingAccess, company, filters.status]); // Thêm filters.status vào dep để auto reload khi đổi tab

    // --- Handlers ---
    const handleSearch = (e) => {
        if (!e || e.key === "Enter") {
            setPage(1);
            fetchData({ page: 1 });
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        setPage(newPage);
        fetchData({ page: newPage });
    };

    // --- Guards ---
    if (checkingAccess) return <div className="p-10 text-center text-slate-400">Đang tải dữ liệu...</div>;
    if (!company || company.status !== "approved") {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-500">
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center max-w-md">
                    <Receipt className="w-10 h-10 mx-auto text-slate-300 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-900">Chưa thể truy cập</h3>
                    <p className="mt-2 text-sm">Vui lòng tạo hồ sơ công ty và chờ duyệt để sử dụng tính năng thanh toán.</p>
                </div>
            </div>
        );
    }

    // --- Render ---
    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* 1. PAGE HEADER & STATS */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            Quản lý đơn hàng
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Lịch sử giao dịch và hóa đơn thanh toán.
                        </p>
                    </div>

                    {/* Mini Stat Card */}
                    <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 rounded-lg">
                            <Receipt className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium uppercase">Tổng đơn hàng</p>
                            <p className="text-lg font-bold text-slate-900 leading-none">{total}</p>
                        </div>
                    </div>
                </div>

                {/* 2. TOOLBAR (Filter & Search) */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    {/* Quick Tabs - Thay thế Select */}
                    <StatusFilterTabs
                        current={filters.status}
                        onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                    />

                    {/* Search Bar */}
                    <div className="flex items-center gap-2 w-full lg:w-auto">
                        <div className="relative group w-full lg:w-80">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                <Search className="w-4 h-4" />
                            </div>
                            <TextInput
                                name="keyword"
                                placeholder="Tìm kiếm mã đơn, gói dịch vụ..."
                                value={filters.keyword}
                                onChange={(e) => setFilters(p => ({ ...p, keyword: e.target.value }))}
                                onKeyDown={handleSearch}
                                className="pl-9 py-2 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-lg shadow-sm text-sm"
                                width="full"
                            />
                        </div>
                        <Button
                            onClick={() => handleSearch()}
                            variant="primary"
                            className="!py-2 !px-4 shadow-sm shadow-indigo-200"
                        >
                            Tìm
                        </Button>
                    </div>
                </div>

                {/* 3. MAIN TABLE */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs uppercase text-slate-500 font-semibold tracking-wider">
                                    <th className="px-6 py-4 w-[160px]">Mã đơn / Gói</th>
                                    <th className="px-6 py-4 text-right">Số tiền</th>
                                    <th className="px-6 py-4 text-center">Trạng thái</th>
                                    <th className="px-6 py-4">Ngày tạo / Thanh toán</th>
                                    <th className="px-6 py-4 w-[200px]">Thông tin GD</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {loading ? (
                                    // Loading Skeleton
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-24 mb-2" /><div className="h-3 bg-slate-50 rounded w-16" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-20 ml-auto" /></td>
                                            <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-32" /></td>
                                            <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded w-full" /></td>
                                        </tr>
                                    ))
                                ) : orders.length === 0 ? (
                                    // Empty State
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3 text-slate-300">
                                                    <Filter className="w-6 h-6" />
                                                </div>
                                                <p className="text-slate-900 font-medium">Không tìm thấy đơn hàng nào</p>
                                                <p className="text-slate-500 text-xs mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
                                                {(filters.keyword || filters.status) && (
                                                    <button
                                                        onClick={() => { setFilters({ keyword: '', status: '' }); }}
                                                        className="mt-4 text-xs font-medium text-indigo-600 hover:text-indigo-700 hover:underline"
                                                    >
                                                        Xóa bộ lọc
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Data Rows
                                    orders.map((order) => (
                                        <tr key={order.id} className="group hover:bg-slate-50 transition-colors">

                                            {/* Column 1: Order ID & Plan */}
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex items-start gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-1.5 mb-1">
                                                            <span className="font-mono text-xs font-medium text-slate-500">#</span>
                                                            <span className="font-mono font-bold text-slate-900 group-hover:text-indigo-600 transition-colors" title={order.id}>
                                                                {order.id}
                                                            </span>
                                                            <CopyButton text={order.id} />
                                                        </div>
                                                        <div className="flex items-center gap-1 text-slate-600">
                                                            <CreditCard className="w-3 h-3 text-slate-400" />
                                                            <span className="text-xs font-medium truncate max-w-[120px]" title={order.plan?.name}>
                                                                {order.plan?.name || "Unknown Plan"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Column 2: Amount (Right aligned) */}
                                            <td className="px-6 py-4 align-top text-right">
                                                <span className="block font-bold text-slate-900 font-mono tracking-tight">
                                                    {formatVnd(order.amount)}
                                                </span>
                                                <span className="text-xs text-slate-400 uppercase">VND</span>
                                            </td>

                                            {/* Column 3: Status (Center) */}
                                            <td className="px-6 py-4 align-top text-center">
                                                <StatusBadge status={order.status} />
                                            </td>

                                            {/* Column 4: Dates */}
                                            <td className="px-6 py-4 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        <span>Tạo: {formatDateTime(order.created_at)}</span>
                                                    </div>
                                                    {order.paid_at && (
                                                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 w-fit px-1.5 py-0.5 rounded">
                                                            <Check className="w-3 h-3" />
                                                            <span>TT: {formatDateTime(order.paid_at)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Column 5: Transaction Info */}
                                            <td className="px-6 py-4 align-top">
                                                {order.vnp ? (
                                                    <div className="flex flex-col gap-2">
                                                        {/* Dòng 1: Cổng thanh toán */}
                                                        <div className="flex items-center text-xs">
                                                            {/* Dùng min-w cố định để các giá trị thẳng hàng dọc */}
                                                            <span className="text-slate-400 font-medium min-w-[50px]">
                                                                Cổng:
                                                            </span>
                                                            <span className="font-medium text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wide">
                                                                VNPAY
                                                            </span>
                                                        </div>

                                                        {/* Dòng 2: Mã giao dịch */}
                                                        <div className="flex items-center text-xs group/item">
                                                            <span className="text-slate-400 font-medium min-w-[50px]">
                                                                Mã GD:
                                                            </span>
                                                            <div className="flex items-center gap-1.5">
                                                                <span
                                                                    className="font-mono text-slate-700 font-medium truncate max-w-[100px]"
                                                                    title={order.vnp.transaction_no}
                                                                >
                                                                    {order.vnp.transaction_no}
                                                                </span>
                                                                {/* Nút copy chỉ hiện khi hover vào dòng này để đỡ rối */}
                                                                <div className="opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                                    <CopyButton text={order.vnp.transaction_no} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic pl-1">
                                                        Chưa ghi nhận
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* 4. FOOTER PAGINATION */}
                    {totalPages > 1 && (
                        <div className="border-t border-slate-200 bg-slate-50 px-6 py-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">
                                Trang {page} / {totalPages}
                            </span>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === 1 || loading}
                                    onClick={() => handlePageChange(page - 1)}
                                    className="h-8 w-8 !p-0 flex items-center justify-center rounded-lg border-slate-300 text-slate-600 hover:bg-white hover:text-indigo-600"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={page === totalPages || loading}
                                    onClick={() => handlePageChange(page + 1)}
                                    className="h-8 w-8 !p-0 flex items-center justify-center rounded-lg border-slate-300 text-slate-600 hover:bg-white hover:text-indigo-600"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}