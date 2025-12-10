// src/pages/admin/companies/ManageCompanyPage.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    Building2,
    Mail,
    User,
    Briefcase,
    ChevronRight,
    ChevronLeft,
    FileText,
    CalendarClock,
} from "lucide-react";

import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
import CompanyAPI from "@/features/companies/CompanyAPI";

const PAGE_SIZE = 10;

// ==========================
//  HELPER FUNCTIONS
// ==========================

const getCompanyStatusBadge = (status) => {
    switch (status) {
        case "approved":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Đã duyệt
                </span>
            );
        case "pending":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Chờ duyệt
                </span>
            );
        case "rejected":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Từ chối
                </span>
            );
        case "hidden":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Đang ẩn
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    {status || "Không rõ"}
                </span>
            );
    }
};

const formatDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("vi-VN");
};

export default function ManageCompanyForAdmin() {
    // ─────────────────────────────────────────
    // State
    // ─────────────────────────────────────────
    const [filters, setFilters] = useState({
        search: "",
        status: "",
    });

    const [companies, setCompanies] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const limit = PAGE_SIZE;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const navigate = useNavigate();

    // ─────────────────────────────────────────
    // Fetch data
    // ─────────────────────────────────────────
    const fetchData = async (params = {}) => {
        try {
            setLoading(true);
            const currentPage = params.page || page || 1;

            const res = await CompanyAPI.getAllForAdmin({
                page: currentPage,
                limit,
                search: filters.search || undefined,
                status: filters.status || undefined,
                ...params,
            });

            // Dựa theo response mẫu trong Postman
            const payload = res.data?.data || res.data || {};
            const list = payload.companies || [];

            setCompanies(list);
            setTotal(payload.total ?? list.length ?? 0);
            setPage(payload.page || currentPage);
        } catch (err) {
            console.error("❌ Lỗi lấy danh sách công ty:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData({ page: 1 });
    }, []);

    // thay đổi status thì auto load lại, giữ y hệt ManageJobPage
    useEffect(() => {
        fetchData({ page: 1 });
        setPage(1);
    }, [filters.status]);

    // ─────────────────────────────────────────
    // Handlers
    // ─────────────────────────────────────────
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

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

    const handleResetFilters = () => {
        setFilters({ search: "", status: "" });
        setPage(1);
        fetchData({ page: 1, search: undefined, status: undefined });
    };

    // ─────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50/50 pb-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* --- HEADER --- */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                            <Building2 className="w-6 h-6 text-indigo-600" />
                            Quản lý công ty
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Theo dõi và quản lý tất cả công ty đang hoạt động trên hệ thống.
                        </p>
                    </div>

                    {/* Với admin thường không có nút "tạo mới" công ty, nên bỏ nút bên phải */}
                </div>

                {/* --- TOOLBAR (SEARCH & FILTER) --- */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto flex-1">
                        {/* Search Input */}
                        <div
                            className="relative w-full md:max-w-md group"
                            onKeyDown={handleSearch}
                        >
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 text-slate-400 pointer-events-none">
                                <Search className="w-4 h-4" />
                            </div>

                            <TextInput
                                name="search"
                                placeholder="Tìm kiếm theo tên công ty, email..."
                                value={filters.search}
                                onChange={handleChange}
                                className="pl-11"
                                width="full"
                            />
                        </div>

                        {/* Filter Status */}
                        <div className="w-full md:w-56">
                            <SelectInput
                                name="status"
                                value={filters.status}
                                onChange={handleChange}
                                options={[
                                    { value: "", label: "Tất cả trạng thái" },
                                    { value: "pending", label: "Chờ duyệt" },
                                    { value: "approved", label: "Đã duyệt" },
                                    { value: "rejected", label: "Từ chối" },
                                    { value: "hidden", label: "Đang ẩn" },
                                ]}
                                className="!bg-white !border-slate-200"
                            />
                        </div>

                        {/* Search Button */}
                        <Button onClick={() => handleSearch()} variant="primary">
                            Tìm kiếm
                        </Button>
                    </div>

                    {/* Stats Summary */}
                    {!loading && (
                        <div className="hidden lg:flex items-center gap-2 text-sm text-slate-500 px-4 py-2 bg-slate-50 rounded-lg border border-slate-100">
                            <span>Tổng cộng:</span>
                            <span className="font-bold text-slate-900">{total}</span>
                            <span>công ty</span>
                        </div>
                    )}
                </div>

                {/* --- DATA TABLE --- */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="bg-slate-50/50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[35%]">
                                        Công ty & tài khoản
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-[30%]">
                                        Thông tin liên hệ
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Trạng thái
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Số tin tuyển dụng
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                        Thao tác
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    // Skeleton Loading
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                                                <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                                                <div className="h-3 bg-slate-100 rounded w-1/3"></div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="h-6 bg-slate-200 rounded-full w-24 mx-auto"></div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className="h-4 bg-slate-200 rounded w-10 mx-auto"></div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="h-8 w-8 bg-slate-200 rounded ml-auto"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : companies.length === 0 ? (
                                    // Empty State
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                                    <FileText className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <p className="text-slate-900 font-medium mb-1">
                                                    Không tìm thấy công ty nào
                                                </p>
                                                <p className="text-slate-500 text-sm mb-4">
                                                    Thử thay đổi bộ lọc hoặc xóa bộ lọc tìm kiếm hiện tại.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleResetFilters}
                                                >
                                                    Xóa bộ lọc
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    // Data Rows
                                    companies.map((company) => (
                                        <tr
                                            key={company.id}
                                            onClick={() => navigate(`/admin/companies/${company.id}`)}
                                            className="group hover:bg-slate-50/80 transition-colors cursor-pointer"
                                        >
                                            {/* Company & account */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                                                        {company.logo_url ? (
                                                            <img
                                                                src={company.logo_url}
                                                                alt={company.name}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <Building2 className="w-5 h-5 text-slate-400" />
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span
                                                            className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1"
                                                            title={company.name}
                                                        >
                                                            {company.name || "—"}
                                                        </span>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                                            <Mail className="w-3 h-3" />
                                                            <span
                                                                className="truncate max-w-[220px]"
                                                                title={company.account_email}
                                                            >
                                                                {company.account_email || "—"}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                                                            <CalendarClock className="w-3 h-3" />
                                                            <span>
                                                                Tham gia: {formatDate(company.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Contact info */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
                                                        <User className="w-3.5 h-3.5 text-slate-500" />
                                                        <span>
                                                            {company.representative_name ||
                                                                "Chưa cập nhật người đại diện"}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        <span
                                                            className="truncate max-w-[260px]"
                                                            title={company.contact_email}
                                                        >
                                                            {company.contact_email || "—"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Status */}
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                {getCompanyStatusBadge(company.status)}
                                            </td>

                                            {/* Total jobs */}
                                            <td className="px-6 py-4 text-center whitespace-nowrap">
                                                <div
                                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-sm font-bold ${(company.total_jobs ?? 0) > 0
                                                        ? "bg-indigo-50 text-indigo-600"
                                                        : "bg-slate-100 text-slate-400"
                                                        }`}
                                                >
                                                    <Briefcase className="w-3.5 h-3.5" />
                                                    {company.total_jobs ?? 0}
                                                </div>
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 text-right whitespace-nowrap">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="!shadow-none !border-none text-slate-400 group-hover:text-indigo-500"
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/admin/companies/${company.id}`);
                                                    }}
                                                >
                                                    <ChevronRight className="w-5 h-5" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* --- PAGINATION --- */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                            <p className="text-xs text-slate-500">
                                Hiển thị trang{" "}
                                <span className="font-semibold text-slate-700">{page}</span> trên{" "}
                                <span className="font-semibold text-slate-700">
                                    {totalPages}
                                </span>
                            </p>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="white"
                                    size="sm"
                                    className="!px-2 border-slate-200 text-slate-600 disabled:opacity-50"
                                    onClick={() => handlePageChange(page - 1)}
                                    disabled={page === 1 || loading}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <div className="px-3 py-1 bg-white border border-slate-200 rounded text-sm font-medium text-slate-700 shadow-sm">
                                    {page}
                                </div>
                                <Button
                                    variant="white"
                                    size="sm"
                                    className="!px-2 border-slate-200 text-slate-600 disabled:opacity-50"
                                    onClick={() => handlePageChange(page + 1)}
                                    disabled={page === totalPages || loading}
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
