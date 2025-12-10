import { Loader2, Building2, PlusCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import CompanyProfileHeader from "./CompanyProfileHeader";
import CompanyProfileContent from "./CompanyProfileContent";

export default function CompanyProfileView({
    company,
    loading,
    onEdit,
    onCreate, // Action khi chưa có công ty (Recruiter)
    isAdmin = false, // Prop để xử lý logic hiển thị cho Admin
    renderActions, // (company) => ReactNode – khu vực action cho Admin
}) {
    // 1. LOADING STATE
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-sm text-slate-500 font-medium">
                        Đang tải thông tin doanh nghiệp...
                    </p>
                </div>
            </div>
        );
    }

    // 2. EMPTY STATE
    if (!company) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
                <div className="max-w-md w-full bg-white p-10 rounded-2xl shadow-sm border border-slate-200 text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Building2 className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-3">
                        {isAdmin ? "Không tìm thấy dữ liệu" : "Hồ sơ công ty trống"}
                    </h2>
                    <p className="text-slate-500 mb-8 text-sm leading-relaxed">
                        {isAdmin
                            ? "Công ty này không tồn tại hoặc chưa cập nhật thông tin."
                            : "Bạn cần cập nhật thông tin công ty để bắt đầu đăng tin tuyển dụng và thu hút ứng viên."}
                    </p>

                    {/* Admin thì không hiện nút tạo */}
                    {!isAdmin && onCreate && (
                        <Button
                            onClick={onCreate}
                            className="w-full justify-center gap-2 py-2.5"
                        >
                            <PlusCircle className="w-5 h-5" />
                            Tạo hồ sơ công ty
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    // 3. DATA DISPLAY
    return (
        <div className="bg-slate-50/50 min-h-screen pb-12">
            <CompanyProfileHeader
                company={company}
                onEdit={onEdit}
                canEdit={!isAdmin} // Admin thì không hiện nút Edit
            />

            {/* Khu vực action cho Admin (ẩn/hiện/duyệt/từ chối) */}
            {typeof renderActions === "function" && (
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
                    {renderActions(company)}
                </div>
            )}

            <CompanyProfileContent company={company} />
        </div>
    );
}
