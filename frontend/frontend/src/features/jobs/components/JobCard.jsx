import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Heart, MapPin, Briefcase, Clock, TrendingUp } from "lucide-react";
import CandidateAPI from "@/features/candidates/CandidateAPI";
import toast from "react-hot-toast";

export const JobCard = ({ job, isSaved = false, onToggleSave }) => {
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  const daysAgo = job.created_at
    ? Math.floor((Date.now() - new Date(job.created_at)) / (1000 * 60 * 60 * 24))
    : null;

  const salaryText =
    job.salary_min && job.salary_max
      ? `${job.salary_min} - ${job.salary_max} triệu`
      : job.salary_min
      ? `Từ ${job.salary_min} triệu`
      : job.salary_max
      ? `Đến ${job.salary_max} triệu`
      : "Thoả thuận";

  const handleSave = async (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Vui lòng đăng nhập để lưu công việc");
      navigate("/login");
      return;
    }

    if (user.role !== "candidate") {
      toast.error("Chỉ ứng viên mới có thể lưu công việc");
      return;
    }

    try {
      setLoading(true);
      if (!saved) {
        await CandidateAPI.saveJob(job.id);
        toast.success("Đã lưu công việc thành công 🎉");
        setSaved(true);
        onToggleSave?.(job.id, true);
      } else {
        await CandidateAPI.unsaveJob(job.id);
        toast("Đã hủy lưu công việc", { icon: "🗑️" });
        setSaved(false);
        onToggleSave?.(job.id, false);
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể lưu công việc";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate(`/jobs/${job.id}`, { state: { isSaved: saved } });
  };

  // Xác định badge "HOT" hoặc "NEW"
  const isNew = daysAgo !== null && daysAgo <= 3;
  const isHot = job.is_hot || job.views > 100; // Giả sử có field is_hot hoặc views

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative flex items-stretch gap-5 p-4 sm:p-6 bg-white rounded-2xl border border-slate-200 transition-all duration-300 cursor-pointer overflow-hidden
        ${
          isHovered
            ? "border-blue-400 shadow-lg shadow-blue-100 -translate-y-0.5"
            : "hover:shadow-md"
        }`}
    >
      {/* 🎨 Gradient overlay khi hover */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50 opacity-0 transition-opacity duration-300 pointer-events-none
          ${isHovered ? "opacity-100" : ""}`}
      />

      {/* 🏷️ Badge HOT/NEW */}
      {(isNew || isHot) && (
        <div className="absolute top-4 right-4 z-10">
          {isHot && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg animate-pulse">
              🔥 HOT
            </span>
          )}
          {isNew && !isHot && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
              ✨ MỚI
            </span>
          )}
        </div>
      )}

      {/* 🏢 Logo công ty */}
      <div className="relative flex-shrink-0 z-10">
        <div
          className={`w-24 h-24 rounded-xl overflow-hidden border-2 shadow-md transition-all duration-300
            ${
              isHovered
                ? "border-blue-400 shadow-lg scale-105"
                : "border-slate-200"
            }`}
        >
          <img
            src={job.company_logo || "/default-company-logo.png"}
            alt="Company logo"
            className="w-full h-full object-cover"
          />
        </div>
        {/* Hiệu ứng glow khi hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-blue-400/20 rounded-xl blur-xl -z-10" />
        )}
      </div>

      {/* 🌟 Nội dung chính */}
      <div className="relative flex-1 flex flex-col justify-between min-w-0 z-10">
        {/* --- Hàng 1: Title + Company --- */}
        <div className="space-y-1.5">
          <h3
            className={`text-xl font-bold text-slate-900 line-clamp-1 transition-colors duration-200
              ${isHovered ? "text-blue-600" : ""}`}
          >
            {job.title}
          </h3>
          <p className="text-slate-600 font-semibold text-sm flex items-center gap-2">
            <Briefcase size={16} className="text-slate-400" />
            {job.company_name || "Công ty ẩn danh"}
          </p>
        </div>

        {/* --- Hàng 2: Salary Box --- */}
        <div className="mt-3">
          <div
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all duration-300
              ${
                isHovered
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-200"
                  : "bg-blue-50 text-blue-700 border border-blue-200"
              }`}
          >
            <TrendingUp size={16} />
            {salaryText}
          </div>
        </div>

        {/* --- Hàng 3: Tags + Metadata --- */}
        <div className="flex items-end justify-between mt-4 gap-4">
          {/* Tags bên trái */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Location */}
            {job.location_city && (
              <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 transition-all hover:bg-slate-200">
                <MapPin size={14} />
                {job.location_city}
              </span>
            )}

            {/* Experience */}
            {Array.isArray(job.experience_levels) &&
              job.experience_levels.length > 0 && (
                <span className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-200 transition-all hover:bg-purple-100">
                  <Briefcase size={14} />
                  {job.experience_levels[0]}
                </span>
              )}

            {/* Category */}
            {job.category && (
              <span className="inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-200 transition-all hover:from-blue-100 hover:to-indigo-100">
                {job.category}
              </span>
            )}
          </div>

          {/* Time + Heart bên phải */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Time badge */}
            {daysAgo !== null && (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                <Clock size={14} />
                <span className="font-medium whitespace-nowrap">
                  {daysAgo === 0
                    ? "Hôm nay"
                    : daysAgo === 1
                    ? "1 ngày trước"
                    : `${daysAgo} ngày trước`}
                </span>
              </div>
            )}

            {/* Heart button */}
            <button
              disabled={loading}
              onClick={handleSave}
              className={`relative w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all duration-300 transform hover:scale-110
                ${
                  saved
                    ? "bg-gradient-to-br from-red-500 to-pink-500 border-red-500 text-white shadow-lg shadow-red-200"
                    : "border-slate-300 text-slate-400 hover:border-red-400 hover:text-red-500 hover:bg-red-50"
                }
                ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              title={saved ? "Hủy lưu công việc" : "Lưu công việc"}
            >
              <Heart
                size={20}
                strokeWidth={2.5}
                fill={saved ? "currentColor" : "none"}
                className={`transition-transform duration-300 ${
                  saved ? "scale-110" : ""
                }`}
              />
              {/* Ripple effect khi click */}
              {loading && (
                <span className="absolute inset-0 rounded-xl border-2 border-blue-400 animate-ping" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 🎯 Hover indicator line */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 transition-all duration-300
          ${isHovered ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
};

export default JobCard;
