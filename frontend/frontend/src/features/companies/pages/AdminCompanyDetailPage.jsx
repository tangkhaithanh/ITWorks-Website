import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    Eye,
    EyeOff,
    XCircle,
} from "lucide-react";

import CompanyAPI from "@/features/companies/CompanyAPI";
import CompanyProfileView from "@/features/companies/components/CompanyProfileView";
import Button from "@/components/ui/Button";
import Swal from "sweetalert2";
export default function AdminCompanyDetailPage() {
    const { id } = useParams(); // route: /admin/companies/:id
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [company, setCompany] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchCompany = useCallback(async () => {
        if (!id) return;

        setLoading(true);
        try {
            const res = await CompanyAPI.getForEdit(id);
            setCompany(res.data?.data || null);
        } catch (error) {
            console.error("Failed to fetch company for admin", error);

            Swal.fire({
                title: "Không thể tải dữ liệu",
                text:
                    error?.response?.data?.message ||
                    "Đã xảy ra lỗi khi tải thông tin công ty.",
                icon: "error",
                confirmButtonText: "Đóng",
            });

            setCompany(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        fetchCompany();
    }, [fetchCompany]);

    const handleBack = () => {
        navigate("/admin/companies");
    };

    const runActionAndRefresh = async (actionFn, confirmOptions, successMessage) => {
        if (!company?.id) return;

        // 1️⃣ Hiển thị Swal confirm
        const result = await Swal.fire({
            title: confirmOptions.title,
            text: confirmOptions.text,
            icon: confirmOptions.icon || "warning",
            showCancelButton: true,
            confirmButtonText: confirmOptions.confirmText || "Xác nhận",
            cancelButtonText: confirmOptions.cancelText || "Hủy",
            confirmButtonColor: confirmOptions.confirmColor || "#2563eb",
        });

        if (!result.isConfirmed) return;

        // 2️⃣ Gọi API
        setActionLoading(true);
        try {
            await actionFn(company.id);

            // 3️⃣ Swal báo thành công
            await Swal.fire({
                title: successMessage.title,
                text: successMessage.text,
                icon: "success",
                timer: 1500,
                showConfirmButton: false,
            });

            await fetchCompany(); // ⭐ reload trạng thái mới
        } catch (error) {
            Swal.fire({
                title: "Lỗi",
                text: error?.response?.data?.message || "Thao tác thất bại",
                icon: "error",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleHide = () =>
        runActionAndRefresh(
            CompanyAPI.hide,
            {
                title: "Ẩn công ty?",
                text: "Công ty sẽ bị ẩn và không hiển thị với ứng viên.",
                icon: "warning",
                confirmText: "Ẩn ngay",
                confirmColor: "#dc2626",
            },
            {
                title: "Đã ẩn công ty",
                text: "Công ty đã được chuyển sang trạng thái ẩn.",
            }
        )
    const handleUnhide = () =>
        runActionAndRefresh(
            CompanyAPI.unhide,
            {
                title: "Hiển thị công ty?",
                text: "Công ty sẽ được hiển thị công khai cho ứng viên.",
                icon: "question",
                confirmText: "Hiển thị",
                confirmColor: "#2563eb",
            },
            {
                title: "Đã hiển thị",
                text: "Công ty đã được chuyển sang trạng thái hoạt động.",
            }
        );

    const handleApprove = () =>
        runActionAndRefresh(
            CompanyAPI.approve,
            {
                title: "Duyệt công ty?",
                text: "Sau khi duyệt, công ty có thể bắt đầu đăng tin tuyển dụng.",
                icon: "info",
                confirmText: "Duyệt",
                confirmColor: "#16a34a",
            },
            {
                title: "Đã duyệt",
                text: "Công ty đã được chấp thuận.",
            }
        );
    const handleReject = () =>
        runActionAndRefresh(
            CompanyAPI.reject,
            {
                title: "Từ chối công ty?",
                text: "Công ty sẽ không thể hoạt động trên hệ thống.",
                icon: "error",
                confirmText: "Từ chối",
                confirmColor: "#dc2626",
            },
            {
                title: "Đã từ chối",
                text: "Công ty đã bị từ chối.",
            }
        );

    const renderActions = (currentCompany) => {
        if (!currentCompany) return null;

        const status = (currentCompany.status || "").toLowerCase();

        return (
            <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Nút quay lại list admin */}
                <Button
                    variant="ghost"
                    onClick={handleBack}
                    className="gap-2 text-slate-600 hover:text-slate-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Quay lại danh sách công ty
                </Button>

                <div className="flex flex-wrap gap-3">
                    {/* Ẩn / Hiện company */}
                    {status === "approved" && (
                        <Button
                            variant="outline"
                            onClick={handleHide}
                            disabled={actionLoading}
                            className="gap-2 border-slate-300 text-slate-700"
                        >
                            <EyeOff className="w-4 h-4" />
                            Ẩn công ty
                        </Button>
                    )}

                    {status === "hidden" && (
                        <Button
                            variant="outline"
                            onClick={handleUnhide}
                            disabled={actionLoading}
                            className="gap-2 border-slate-300 text-slate-700"
                        >
                            <Eye className="w-4 h-4" />
                            Hiển thị công ty
                        </Button>
                    )}

                    {/* Chấp nhận / Từ chối khi đang pending */}
                    {status === "pending" && (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleReject}
                                disabled={actionLoading}
                                className="gap-2 border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                            >
                                <XCircle className="w-4 h-4" />
                                Từ chối
                            </Button>
                            <Button
                                onClick={handleApprove}
                                disabled={actionLoading}
                                className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Chấp nhận
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    };

    return (
        <CompanyProfileView
            company={company}
            loading={loading}
            isAdmin={true}
            onEdit={undefined}   // Admin không có nút Edit
            onCreate={undefined} // Admin không tạo hồ sơ tại đây
            renderActions={renderActions}
        />
    );
}
