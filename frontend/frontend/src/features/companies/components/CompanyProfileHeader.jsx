import { Building2, Edit3, Globe, Users } from "lucide-react";
import Button from "@/components/ui/Button";

function getStatusConfig(statusRaw) {
    const status = (statusRaw || "").toLowerCase();

    switch (status) {
        case "pending":
            return {
                label: "Chờ duyệt",
                className:
                    "bg-amber-50 text-amber-700 border border-amber-200",
            };
        case "approved":
            return {
                label: "Đang hoạt động",
                className:
                    "bg-emerald-50 text-emerald-700 border border-emerald-200",
            };
        case "hidden":
            return {
                label: "Đang ẩn",
                className:
                    "bg-slate-50 text-slate-700 border border-slate-200",
            };
        case "rejected":
            return {
                label: "Đã từ chối",
                className:
                    "bg-rose-50 text-rose-700 border border-rose-200",
            };
        default:
            if (!statusRaw) {
                return null;
            }
            return {
                label: statusRaw,
                className:
                    "bg-slate-50 text-slate-700 border border-slate-200",
            };
    }
}

export default function CompanyProfileHeader({ company, onEdit, canEdit = true }) {
    const statusConfig = getStatusConfig(company.status);

    return (
        <div className="bg-white border-b border-slate-200">
            {/* Cover Background */}
            <div className="h-44 w-full bg-gradient-to-r from-slate-800 to-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>

                {/* Chỉ hiển thị nút Edit nếu có quyền (Recruiter) */}
                {canEdit && (
                    <div className="absolute top-6 right-6 z-10">
                        <Button
                            variant="white"
                            onClick={onEdit}
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-md shadow-none gap-2 flex items-center text-xs px-3 py-2"
                        >
                            <Edit3 className="w-4 h-4" />
                            Chỉnh sửa
                        </Button>
                    </div>
                )}
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
                <div className="relative flex flex-col md:flex-row items-end -mt-10 gap-6">
                    {/* Logo Box */}
                    <div className="relative flex-shrink-0">
                        {company.logo_url ? (
                            <img
                                src={company.logo_url}
                                alt={company.name}
                                className="w-28 h-28 md:w-32 md:h-32 rounded-xl object-cover border-4 border-white shadow-lg bg-white"
                            />
                        ) : (
                            <div className="w-28 h-28 md:w-32 md:h-32 rounded-xl bg-indigo-50 border-4 border-white shadow-lg flex items-center justify-center text-indigo-400">
                                <Building2 className="w-12 h-12" />
                            </div>
                        )}
                    </div>

                    {/* Title Info */}
                    <div className="flex-1 w-full md:w-auto text-center md:text-left pb-1">
                        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 leading-tight">
                            {company.name}
                        </h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 gap-y-2 mt-3 text-sm text-slate-600">
                            {company.website && (
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors group"
                                >
                                    <Globe className="w-4 h-4 text-slate-400 group-hover:text-indigo-500" />
                                    <span className="truncate max-w-[200px] font-medium">
                                        {company.website.replace(/^https?:\/\//, "")}
                                    </span>
                                </a>
                            )}

                            {/* Quy mô */}
                            <div className="flex items-center gap-1.5">
                                <Users className="w-4 h-4 text-slate-400" />
                                <span>{company.size || "Quy mô chưa cập nhật"}</span>
                            </div>

                            {/* Trạng thái công ty */}
                            {statusConfig && (
                                <div className="flex items-center">
                                    <span
                                        className={
                                            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide " +
                                            statusConfig.className
                                        }
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
                                        {statusConfig.label}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
