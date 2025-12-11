import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Heart, MapPin, Briefcase, Clock, DollarSign, Building2 } from "lucide-react";
import CandidateAPI from "@/features/candidates/CandidateAPI";
import toast from "react-hot-toast";

export const JobCard = ({ job, isSaved = false, onToggleSave }) => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const daysAgo = job.created_at
    ? Math.floor((Date.now() - new Date(job.created_at)) / (1000 * 60 * 60 * 24))
    : null;

  // Format lương gọn hơn
  const salaryText =
    job.salary_min && job.salary_max
      ? `${job.salary_min} - ${job.salary_max} tr`
      : job.salary_min
        ? `> ${job.salary_min} tr`
        : job.salary_max
          ? `< ${job.salary_max} tr`
          : "Thoả thuận";

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu công việc");
      return navigate("/login");
    }
    if (user.role !== "candidate") {
      return toast.error("Chỉ ứng viên mới có thể lưu công việc");
    }

    try {
      setLoading(true);
      if (!saved) {
        await CandidateAPI.saveJob(job.id);
        toast.success("Đã lưu tin tuyển dụng");
        setSaved(true);
        onToggleSave?.(job.id, true);
      } else {
        await CandidateAPI.unsaveJob(job.id);
        toast.success("Đã hủy lưu tin tuyển dụng");
        setSaved(false);
        onToggleSave?.(job.id, false);
      }
    } catch (err) {
      toast.error("Thao tác thất bại");
    } finally {
      setLoading(false);
    }
  };

  const isNew = daysAgo !== null && daysAgo <= 3;
  const isHot = job.is_hot || job.views > 100;

  return (
    <div
      onClick={() => navigate(`/jobs/${job.id}`, { state: { isSaved: saved } })}
      className="group relative bg-white rounded-xl border border-slate-200 p-5 transition-all duration-300 hover:border-blue-400 hover:shadow-lg cursor-pointer"
    >
      {/* Badge Hot/New - Đặt tinh tế hơn */}
      <div className="absolute top-0 right-0 flex">
        {isHot && (
          <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">
            HOT
          </span>
        )}
        {isNew && !isHot && (
          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg shadow-sm">
            NEW
          </span>
        )}
      </div>

      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="shrink-0">
          <div className="w-16 h-16 rounded-lg border border-slate-100 bg-white p-1 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
            <img
              src={job.company_logo || "/default-company-logo.png"}
              alt="logo"
              className="w-full h-full object-contain rounded-md"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div className="pr-8">
              <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1 mb-1">
                {job.title}
              </h3>
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Building2 size={14} />
                <span className="line-clamp-1">{job.company_name || "Công ty ẩn danh"}</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={loading}
              className={`p-2 rounded-full transition-colors shrink-0 z-10 ${saved
                ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
                : "bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                }`}
            >
              <Heart size={20} fill={saved ? "currentColor" : "none"} strokeWidth={2} />
            </button>
          </div>

          {/* Metadata Grid */}
          <div className="mt-4 flex flex-wrap items-center gap-y-2 gap-x-4 text-sm">
            <div className="flex items-center gap-1.5 font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md">
              <DollarSign size={14} />
              {salaryText}
            </div>

            {job.location_city && (
              <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                <MapPin size={14} />
                {job.location_city}
              </div>
            )}

            {job.category && (
              <div className="flex items-center gap-1.5 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                <Briefcase size={14} />
                <span className="truncate max-w-[120px]">{job.category}</span>
              </div>
            )}

            {/* Time align right auto nếu cần, hoặc để chung flow */}
            <div className="flex items-center gap-1 text-xs text-slate-400 ml-auto">
              <Clock size={12} />
              <span>{daysAgo === 0 ? "Vừa đăng" : `${daysAgo} ngày trước`}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default JobCard;