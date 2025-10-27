import { useState, useEffect } from "react";
import { X, Pencil } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import Button from "@/components/ui/Button";
import CvAPI from "@/features/candidates/CvAPI";
import Swal from "sweetalert2";
import { applyJob, checkAppliedJob } from "@/features/candidates/candidateSlice";

const ApplyJobModal = ({ job, open, onClose, onAppliedSuccess }) => {
  const dispatch = useDispatch();
  const { appliedJobs, loading } = useSelector((s) => s.candidate);

  const [cvOnlineList, setCvOnlineList] = useState([]);
  const [cvFileList, setCvFileList] = useState([]);
  const [selectedCv, setSelectedCv] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [confirmMode, setConfirmMode] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // ─────────────── Load CVs ───────────────
  useEffect(() => {
    if (!open) return;
    (async () => {
      setFetching(true);
      try {
        const [onlineRes, fileRes] = await Promise.all([
          CvAPI.getMyOnlineCvs(),
          CvAPI.getMyFileCvs(),
        ]);

        setCvOnlineList(onlineRes.data?.data?.items ?? []);
        setCvFileList(fileRes.data?.data?.items ?? []);
      } catch (err) {
        console.error("Lỗi tải danh sách CV:", err);
        setCvOnlineList([]);
        setCvFileList([]);
      } finally {
        setFetching(false);
      }
    })();
  }, [open]);

  const handleSelect = (type, cv) => {
    setSelectedType(type);
    setSelectedCv(cv);
  };

  // ─────────────── Gửi đơn ứng tuyển ───────────────
  const handleConfirm = async () => {
    if (!selectedCv || !job?.id) return;

    if (appliedJobs.includes(job.id)) {
      await Swal.fire({
        icon: "info",
        title: "Bạn đã ứng tuyển công việc này rồi ✅",
        confirmButtonColor: "#2563eb",
      });
      onClose();
      return;
    }

    try {
      setSubmitting(true);
      const result = await dispatch(applyJob({ jobId: job.id, cvId: selectedCv.id }));

      if (applyJob.fulfilled.match(result)) {
        await Swal.fire({
          icon: "success",
          title: "Ứng tuyển thành công 🎉",
          text: "CV của bạn đã được gửi đến nhà tuyển dụng.",
          confirmButtonColor: "#2563eb",
        });

        // 🟩 Gọi lại checkApplied để đồng bộ trạng thái Redux
        await dispatch(checkAppliedJob(job.id));

        // 🟩 Báo về JobHeader để update nút (nếu có)
        onAppliedSuccess?.(job.id);

        onClose();
      } else {
        const msg = result.payload || "Không thể gửi ứng tuyển, vui lòng thử lại sau.";
        await Swal.fire({
          icon: "error",
          title: "Không thể gửi ứng tuyển",
          text: msg,
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (error) {
      console.error("Lỗi khi ứng tuyển:", error);
      await Swal.fire({
        icon: "error",
        title: "Có lỗi xảy ra",
        text: "Vui lòng thử lại sau.",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeCv = () => {
    setConfirmMode(false);
    setSelectedCv(null);
    setSelectedType(null);
  };

  if (!open) return null;

  // ─────────────── UI ───────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm px-3">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative animate-in slide-in-from-bottom-2">
        {/* Đóng */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-700 transition"
        >
          <X size={22} />
        </button>

        {/* Tiêu đề */}
        <h2 className="text-xl font-bold text-slate-800 mb-6">
          Ứng tuyển{" "}
          <span className="text-blue-600">{job?.title || "Công việc"}</span>
        </h2>

        {/* Nội dung */}
        {fetching ? (
          <p className="text-center text-slate-500 py-6">
            Đang tải danh sách CV...
          </p>
        ) : confirmMode ? (
          <div className="text-center space-y-5 py-6">
            <p className="text-slate-700 text-base font-medium">
              Bạn đã chọn{" "}
              <span className="font-semibold text-blue-600">
                {selectedType === "online"
                  ? `CV online: ${selectedCv.title}`
                  : `CV tải lên: ${selectedCv.title}`}
              </span>
            </p>
            <div className="flex justify-center gap-3 pt-4">
              <Button variant="outline" onClick={handleChangeCv}>
                <Pencil size={18} /> Thay đổi
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={submitting || loading}
              >
                {submitting ? "Đang gửi..." : "Gửi ứng tuyển"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* CV Online */}
            <div>
              <h3 className="text-slate-800 font-semibold mb-3">CV online</h3>
              {cvOnlineList.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  Bạn chưa tạo CV online
                </p>
              ) : (
                <div className="space-y-2">
                  {cvOnlineList.map((cv) => (
                    <label
                      key={cv.id}
                      className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-blue-50 transition"
                    >
                      <input
                        type="radio"
                        name="cv"
                        checked={
                          selectedType === "online" && selectedCv?.id === cv.id
                        }
                        onChange={() => handleSelect("online", cv)}
                        className="accent-blue-600"
                      />
                      <span className="font-medium text-slate-700">
                        {cv.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* CV Tải lên */}
            <div>
              <h3 className="text-slate-800 font-semibold mb-3">
                CV tải lên
              </h3>
              {cvFileList.length === 0 ? (
                <p className="text-sm text-slate-500 italic">
                  Bạn chưa tải lên CV
                </p>
              ) : (
                <div className="space-y-2">
                  {cvFileList.map((cv) => (
                    <label
                      key={cv.id}
                      className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-blue-50 transition"
                    >
                      <input
                        type="radio"
                        name="cv"
                        checked={
                          selectedType === "file" && selectedCv?.id === cv.id
                        }
                        onChange={() => handleSelect("file", cv)}
                        className="accent-blue-600"
                      />
                      <span className="font-medium text-slate-700">
                        {cv.title}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Nút xác nhận */}
            <div className="flex justify-end pt-4">
              <Button
                variant="primary"
                onClick={() => setConfirmMode(true)}
                disabled={!selectedCv}
              >
                Xác nhận
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ApplyJobModal;
