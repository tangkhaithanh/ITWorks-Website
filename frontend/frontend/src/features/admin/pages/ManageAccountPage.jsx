import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    ShieldCheck,
    ShieldAlert,
    UserRound,
    Users,
    KeyRound,
    ChevronRight,
    ChevronLeft,
    FileText,
    Filter,
    RotateCcw,
    Building2,
} from "lucide-react";

import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
import AccountAPI from "@/features/admin/AccountAPI";
import AccountDetailModal from "../components/AccountDetailModal";
import Swal from "sweetalert2";
const PAGE_SIZE = 10;

// ==========================
//  HELPER: ROLE BADGE
// ==========================
const getRoleBadge = (role) => {
    switch (role) {
        case "admin":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Quản trị viên
                </span>
            );
        case "recruiter":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Users className="w-3.5 h-3.5" />
                    Nhà tuyển dụng
                </span>
            );
        case "candidate":
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200">
                    <UserRound className="w-3.5 h-3.5" />
                    Ứng viên
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    {role || "Không xác định"}
                </span>
            );
    }
};

// ==========================
//  HELPER: STATUS BADGE
// ==========================
const getStatusBadge = (status) => {
    switch (status) {
        case "active":
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 ring-1 ring-emerald-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                    Hoạt động
                </span>
            );
        case "pending":
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 ring-1 ring-amber-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
                    Chờ duyệt
                </span>
            );
        case "banned":
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 ring-1 ring-rose-500/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                    Đã khóa
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                    {status || "N/A"}
                </span>
            );
    }
};

// ==========================
//  HELPER: GET INFO (Name, Avatar, Type)
// ==========================
const getAccountDisplayInfo = (account) => {
    let name = "Chưa cập nhật";
    let image = null;
    let type = "user"; // 'user' | 'company'

    // Kiểm tra dữ liệu User trước
    if (account.user) {
        name = account.user.full_name || name;
        image = account.user.avatar_url;
    }
    // Nếu không có User, kiểm tra Company
    else if (account.company) {
        name = account.company.name || name;
        image = account.company.logo_url;
        type = "company";
    }

    // Lấy chữ cái đầu làm fallback
    const initial = name.charAt(0).toUpperCase();

    return { name, image, initial, type };
};

export default function ManageAccountPage() {
    // ─────────────────────────────────────────
    // State
    // ─────────────────────────────────────────
    const [filters, setFilters] = useState({
        search: "",
        role: "",
        status: "",
    });

    const [accounts, setAccounts] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);

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

            const res = await AccountAPI.getAll({
                page: currentPage,
                limit,
                search: filters.search || undefined,
                role: filters.role || undefined,
                status: filters.status || undefined,
                ...params,
            });

            const payload = res.data?.data || res.data || {};
            const items = payload.data || payload.items || [];

            setAccounts(items);
            setTotal(payload.total || 0);
            setPage(payload.page || currentPage);
        } catch (error) {
            console.error("❌ Lỗi lấy danh sách tài khoản:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData({ page: 1 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        fetchData({ page: 1 });
        setPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters.role, filters.status]);

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

    const handleResetFilters = () => {
        setFilters({ search: "", role: "", status: "" });
        setTimeout(() => fetchData({ page: 1, search: "", role: "", status: "" }), 0);
    };

    const handlePageChange = (newPage) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        setPage(newPage);
        fetchData({ page: newPage });
    };

    const handleChangeStatus = async (account, targetStatus) => {
        if (!account || !targetStatus) return;

        const confirmTextMap = {
            active: "Bạn có chắc muốn mở khóa tài khoản này?",
            banned: "Bạn có chắc muốn khóa tài khoản này?",
            pending: "Bạn có chắc muốn chuyển tài khoản này về trạng thái chờ duyệt?",
        };

        // Hiển thị swal confirm
        const confirmResult = await Swal.fire({
            title: "Xác nhận",
            text: confirmTextMap[targetStatus] || "Bạn có chắc muốn thay đổi trạng thái?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Đồng ý",
            cancelButtonText: "Hủy",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setActionLoadingId(account.id);

            if (targetStatus === "active") await AccountAPI.activate(account.id);
            else if (targetStatus === "banned") await AccountAPI.ban(account.id);
            else if (targetStatus === "pending") await AccountAPI.setPending(account.id);

            await fetchData({ page });

            // Thông báo thành công
            await Swal.fire({
                title: "Thành công!",
                text: "Cập nhật trạng thái tài khoản thành công.",
                icon: "success",
                timer: 1500
            });

        } catch (error) {
            console.error("❌ Lỗi cập nhật trạng thái:", error);

            Swal.fire({
                title: "Lỗi!",
                text: "Không thể cập nhật trạng thái tài khoản.",
                icon: "error",
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    const handleResetPassword = async (account) => {
        if (!account) return;

        const confirmResult = await Swal.fire({
            title: "Xác nhận reset mật khẩu?",
            html: `Bạn có chắc muốn reset mật khẩu cho <b>${account.email}</b>?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Đồng ý",
            cancelButtonText: "Hủy",
        });

        if (!confirmResult.isConfirmed) return;

        try {
            setActionLoadingId(account.id);
            await AccountAPI.resetPassword(account.id);

            await Swal.fire({
                title: "Thành công!",
                text: "Mật khẩu mới đã được gửi qua email.",
                icon: "success",
            });
        } catch (error) {
            console.error("❌ Lỗi reset mật khẩu:", error);

            Swal.fire({
                title: "Lỗi!",
                text: "Đã xảy ra lỗi khi reset mật khẩu.",
                icon: "error",
            });
        } finally {
            setActionLoadingId(null);
        }
    };
    const openDetailModal = async (accountId) => {
        if (!accountId) return;
        setDetailOpen(true);
        setDetailLoading(true);
        setSelectedAccount(null);

        try {
            const res = await AccountAPI.getDetail(accountId);
            const data = res.data?.data || res.data;
            setSelectedAccount(data);
        } catch (error) {
            console.error("❌ Lỗi lấy chi tiết tài khoản:", error);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeDetailModal = () => {
        setDetailOpen(false);
        setSelectedAccount(null);
    };


    // ─────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────
    return (
        <>
            {/* MODAL CHI TIẾT TÀI KHOẢN - đặt ngoài layout */}
            <AccountDetailModal
                open={detailOpen}
                onClose={closeDetailModal}
                account={selectedAccount}
                loading={detailLoading}
            />

            {/* PAGE WRAPPER */}
            <div className="min-h-screen bg-slate-50/50 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                    {/* HEADER */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                                <ShieldCheck className="w-7 h-7 text-indigo-600" />
                                Quản lý tài khoản
                            </h1>
                            <p className="text-slate-500 mt-1 text-sm">
                                Quản lý danh sách, phân quyền và trạng thái hoạt động của người dùng.
                            </p>
                        </div>
                    </div>

                    {/* TOOLBAR */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">

                        {/* Search & Stats */}
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="w-full md:max-w-lg relative group">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                                    <Search className="w-4 h-4" />
                                </div>
                                <TextInput
                                    name="search"
                                    placeholder="Tìm kiếm theo tên, email, số điện thoại..."
                                    value={filters.search}
                                    onChange={handleChange}
                                    onKeyDown={handleSearch}
                                    className="pl-10 h-10 w-full"
                                />
                            </div>

                            {!loading && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100 whitespace-nowrap">
                                    <Users className="w-4 h-4 text-slate-400" />
                                    <span>
                                        Tổng: <strong className="text-slate-900">{total}</strong> thành viên
                                    </span>
                                </div>
                            )}
                        </div>

                        <hr className="border-slate-100" />

                        {/* Filter & Buttons */}
                        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-700 mr-2">
                                    <Filter className="w-4 h-4" />
                                    <span>Bộ lọc:</span>
                                </div>

                                <div className="w-40">
                                    <SelectInput
                                        name="role"
                                        value={filters.role}
                                        onChange={handleChange}
                                        options={[
                                            { value: "", label: "Tất cả vai trò" },
                                            { value: "admin", label: "Quản trị viên" },
                                            { value: "recruiter", label: "Nhà tuyển dụng" },
                                            { value: "candidate", label: "Ứng viên" },
                                        ]}
                                        className="h-9 text-sm flex items-center !py-0 !my-0 whitespace-nowrap min-w-[150px]"
                                    />
                                </div>

                                <div className="w-40">
                                    <SelectInput
                                        name="status"
                                        value={filters.status}
                                        onChange={handleChange}
                                        options={[
                                            { value: "", label: "Mọi trạng thái" },
                                            { value: "active", label: "Hoạt động" },
                                            { value: "pending", label: "Chờ duyệt" },
                                            { value: "banned", label: "Đã khóa" },
                                        ]}
                                        className="h-9 text-sm flex items-center !py-0 !my-0 whitespace-nowrap min-w-[150px]"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 ml-auto">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetFilters}
                                    className="text-slate-600 border-slate-300 hover:bg-slate-50"
                                >
                                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
                                    Đặt lại
                                </Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleSearch()}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                                >
                                    Tìm kiếm
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* DATA TABLE */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[40%]">
                                            Thành viên
                                        </th>
                                        <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[20%]">
                                            Vai trò
                                        </th>
                                        <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-[15%]">
                                            Trạng thái
                                        </th>
                                        <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-[25%]">
                                            Thao tác
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">
                                    {/* loading skeleton */}
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td className="px-6 py-4"><div className="h-10 bg-slate-100 rounded-lg w-full max-w-sm" /></td>
                                                <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded w-24" /></td>
                                                <td className="px-6 py-4"><div className="h-6 bg-slate-100 rounded-full w-20 mx-auto" /></td>
                                                <td className="px-6 py-4"><div className="h-8 bg-slate-100 rounded w-full max-w-[100px] ml-auto" /></td>
                                            </tr>
                                        ))
                                    ) : accounts.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-16 text-center text-slate-500">
                                                <div className="flex flex-col items-center">
                                                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-3">
                                                        <FileText className="w-6 h-6 text-slate-300" />
                                                    </div>
                                                    <p className="font-medium text-slate-900">Không tìm thấy dữ liệu</p>
                                                    <p className="text-sm mt-1">Vui lòng thử lại với từ khóa hoặc bộ lọc khác.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        accounts.map((acc) => {
                                            const { name, image, initial, type } = getAccountDisplayInfo(acc);
                                            const isActionLoading = actionLoadingId === acc.id;

                                            return (
                                                <tr
                                                    key={acc.id}
                                                    onClick={() => openDetailModal(acc.id)}
                                                    className="group hover:bg-slate-50 transition-colors cursor-pointer"
                                                >
                                                    {/* USER INFO */}
                                                    <td className="px-6 py-4 align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-sm font-bold border overflow-hidden ${type === "company"
                                                                    ? "bg-orange-50 text-orange-600 border-orange-100"
                                                                    : "bg-indigo-50 text-indigo-600 border-indigo-100"
                                                                    }`}
                                                            >
                                                                {image ? (
                                                                    <img
                                                                        src={image}
                                                                        alt={name}
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => (e.target.style.display = "none")}
                                                                    />
                                                                ) : type === "company" ? (
                                                                    <Building2 className="w-5 h-5" />
                                                                ) : (
                                                                    initial
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="font-medium text-slate-900 truncate pr-4">{name}</div>
                                                                <div className="text-sm text-slate-500 truncate">{acc.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* ROLE */}
                                                    <td className="px-6 py-4 align-middle">
                                                        {getRoleBadge(acc.role)}
                                                    </td>

                                                    {/* STATUS */}
                                                    <td className="px-6 py-4 align-middle text-center">
                                                        {getStatusBadge(acc.status)}
                                                    </td>

                                                    {/* ACTIONS */}
                                                    <td className="px-6 py-4 align-middle text-right">
                                                        <div
                                                            className="flex items-center justify-end gap-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                                                onClick={() => handleResetPassword(acc)}
                                                                disabled={isActionLoading}
                                                            >
                                                                <KeyRound className="w-4 h-4" />
                                                            </Button>

                                                            {acc.status === "active" ? (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                                                    onClick={() => handleChangeStatus(acc, "banned")}
                                                                    disabled={isActionLoading}
                                                                >
                                                                    <ShieldAlert className="w-4 h-4" />
                                                                </Button>
                                                            ) : (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                                                    onClick={() => handleChangeStatus(acc, "active")}
                                                                    disabled={isActionLoading}
                                                                >
                                                                    <ShieldCheck className="w-4 h-4" />
                                                                </Button>
                                                            )}

                                                            <div className="w-px h-4 bg-slate-200 mx-1" />

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="text-slate-400 hover:text-indigo-600"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    openDetailModal(acc.id);
                                                                }}
                                                            >
                                                                <ChevronRight className="w-5 h-5" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* PAGINATION */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
                                <span className="text-xs text-slate-500">
                                    Trang <span className="font-semibold text-slate-700">{page}</span> / {totalPages}
                                </span>
                                <div className="flex gap-2">
                                    <Button
                                        variant="white"
                                        size="sm"
                                        className="h-8 w-8 p-0 border-slate-200"
                                        disabled={page === 1 || loading}
                                        onClick={() => handlePageChange(page - 1)}
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </Button>

                                    <Button
                                        variant="white"
                                        size="sm"
                                        className="h-8 w-8 p-0 border-slate-200"
                                        disabled={page === totalPages || loading}
                                        onClick={() => handlePageChange(page + 1)}
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );

}