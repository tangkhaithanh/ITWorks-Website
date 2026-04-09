import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { MapPin, Clock, DollarSign, Briefcase, Heart, MessageCircle } from "lucide-react";
import dayjs from "dayjs";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import ApplyJobModal from "./ApplyJobModal";
import { checkAppliedJob } from "@/features/candidates/candidateSlice";
import CandidateAPI from "@/features/candidates/CandidateAPI";
import MessagingAPI from "@/features/messaging/MessagingAPI";
// ────────────────────────────────
// Item hiển thị thông tin nhỏ (mức lương, địa điểm, v.v.)
// ────────────────────────────────
const Item = ({ icon, label, value, bgClass = "", iconClass = "" }) => (
  <div className="flex items-center gap-2 min-w-0">
    <div className={`rounded-xl p-2.5 shrink-0 ${bgClass}`}>
      {icon && icon({ className: iconClass, size: 20 })}
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="text-sm font-bold text-slate-800 truncate">{value}</p>
    </div>
  </div>
);

// ────────────────────────────────
// JobHeader chính
// ────────────────────────────────
const JobHeader = ({ job, isSaved = false, onToggleSave }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((s) => s.auth);
  const { appliedJobs } = useSelector((s) => s.candidate);
  const navigate = useNavigate();
  const [saved, setSaved] = useState(isSaved);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const isApplied = appliedJobs.includes(job?.id);
  // Xử lý khi prop isSaved thay đổi từ bên ngoài
  useEffect(() => {
    setSaved(isSaved);
  }, [isSaved]);

  // Xử lý check xem đã apply chưa?
   useEffect(() => {
    if (!user || user.role !== "candidate" || !job?.id) return;
    dispatch(checkAppliedJob(job.id));
  }, [user, job?.id]);


  // Kiểm tra job đã lưu chưa
  useEffect(() => {
    if (!user || user.role !== "candidate" || !job?.id) return;
    if (isSaved) return;
    (async () => {
      try {
        const res = await CandidateAPI.checkSavedJob(job.id);
        if (res?.data?.data?.isSaved) setSaved(true);
      } catch (err) {
        console.error(err);
      }
    })();
  }, [user, job?.id]);

  // ─────── handleSave ───────
  const handleSave = async () => {
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

  // ─────── handleApply ───────
  const handleApply = () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để ứng tuyển");
      navigate("/login");
      return;
    }

    if (user.role !== "candidate") {
      toast.error("Chỉ ứng viên mới có thể ứng tuyển");
      return;
    }

    setOpenModal(true);
  };

  const handleChatRecruiter = async () => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để nhắn tin");
      navigate("/login");
      return;
    }
    if (user.role !== "candidate") {
      toast.error("Chỉ ứng viên mới có thể chat với nhà tuyển dụng");
      return;
    }
    try {
      setLoading(true);
      await MessagingAPI.open(job.id);
      toast.success("Đã mở cuộc hội thoại");
      navigate("/messages");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể mở chat";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!job) return null;

  const experienceSummary =
    job.experience_required !== null && job.experience_required !== undefined
      ? `${job.experience_required} nam`
      : Array.isArray(job.experience_levels) && job.experience_levels.length
        ? job.experience_levels.join(", ")
        : "Khong yeu cau";

  // ────────────────────────────────
  // Giao diện hiển thị
  // ────────────────────────────────
  return (
    <div className="w-full box-border rounded-2xl bg-white border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300">
      {/* --- Tiêu đề --- */}
      <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 leading-tight mb-5 break-words">
        {job.title}
      </h1>

      {/* --- Hàng thông tin --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-slate-700 mb-6">
        <Item
          icon={(props) => <DollarSign {...props} />}
          label="Mức lương"
          bgClass="bg-slate-50"
          iconClass="text-blue-600"
          value={
            job.salary_min && job.salary_max
              ? `${job.salary_min} - ${job.salary_max} triệu`
              : "Thoả thuận"
          }
        />
        <Item
          icon={(props) => <MapPin {...props} />}
          label="Địa điểm"
          bgClass="bg-slate-50"
          iconClass="text-blue-600"
          value={job.location_city || "Không xác định"}
        />
        <Item
          icon={(props) => <Briefcase {...props} />}
          label="Vị trí"
          bgClass="bg-slate-50"
          iconClass="text-blue-600"
          value={
            Array.isArray(job.experience_levels) && job.experience_levels.length
              ? job.experience_levels.join(", ")
              : "Không yêu cầu"
          }
        />
        <Item
          icon={(props) => <Clock {...props} />}
          label="Hạn nộp"
          bgClass="bg-slate-50"
          iconClass="text-blue-600"
          value={
            job.deadline
              ? dayjs(job.deadline).format("DD/MM/YYYY")
              : "Không xác định"
          }
        />
      </div>

      {/* Divider */}
      <div className="border-t border-slate-100 my-4" />

      {/* --- Hàng nút hành động --- */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch gap-3 flex-wrap">
        {/* Nút Ứng tuyển ngay */}
        <Button
          onClick={() => {
            if (isApplied) return; // ❌ Không làm gì nếu đã apply
            handleApply();
          }}
          size="md"
          variant="primary"
          disabled={isApplied || loading}
          className={`flex-1 py-3 font-semibold rounded-xl transition-all duration-300
            ${
              isApplied
                ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }
          `}
        >
          {isApplied ? "Đã ứng tuyển" : "Ứng tuyển ngay"}
    </Button>

        <button
          type="button"
          disabled={loading}
          onClick={handleChatRecruiter}
          className="flex-1 min-w-[140px] flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border border-slate-300 text-slate-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50/80 transition-all duration-300 disabled:opacity-60"
        >
          <MessageCircle size={20} />
          Chat nhà tuyển dụng
        </button>

        {/* Nút Lưu tin */}
        <button
          disabled={loading}
          onClick={handleSave}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold border transition-all duration-300
            ${
              saved
                ? "border-blue-600 text-blue-600 bg-blue-50 hover:bg-blue-100"
                : "border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50"
            }
            ${loading ? "opacity-60 cursor-wait" : ""}
          `}
          title={saved ? "Hủy lưu công việc" : "Lưu công việc"}
        >
          <Heart
            size={20}
            strokeWidth={2.3}
            fill={saved ? "currentColor" : "none"}
            className={`transition-transform duration-300 ${
              saved ? "scale-105" : ""
            }`}
          />
          {saved ? "Đã lưu" : "Lưu tin"}
        </button>
          </div>
          <ApplyJobModal
          job={job}
          open={openModal}
          onClose={() => setOpenModal(false)}
        />
    </div>
  );
};

export default JobHeader;
