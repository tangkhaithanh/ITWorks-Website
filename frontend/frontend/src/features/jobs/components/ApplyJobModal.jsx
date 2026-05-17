import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import JoditEditor from "jodit-react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import CvAPI from "@/features/candidates/CvAPI";
import Swal from "sweetalert2";
import { applyJob, checkAppliedJob } from "@/features/candidates/candidateSlice";

const COVER_LETTER_MAX_LENGTH = 1000;

const coverLetterEditorConfig = {
  readonly: false,
  minHeight: 360,
  height: 410,
  placeholder: "Nhập thư ứng tuyển...",
  toolbarAdaptive: false,
  askBeforePasteHTML: false,
  askBeforePasteFromWord: false,
  allowPaste: true,
  buttons: [
    "bold",
    "italic",
    "underline",
    "|",
    "ul",
    "ol",
    "|",
    "link",
    "|",
    "align",
    "undo",
    "redo",
    "|",
    "eraser",
  ],
};

const getPlainTextLength = (html = "") => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent || "").length;
};

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
  const [coverLetter, setCoverLetter] = useState("");

  const coverLetterLength = getPlainTextLength(coverLetter);
  const coverLetterTooLong = coverLetterLength > COVER_LETTER_MAX_LENGTH;

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

  const handleCoverLetterChange = (newContent) => {
    setCoverLetter(newContent);
  };

  // ─────────────── Gửi đơn ứng tuyển ───────────────
  const handleConfirm = async () => {
    if (!selectedCv || !job?.id) return;

    if (coverLetterTooLong) {
      await Swal.fire({
        icon: "error",
        title: "Thư ứng tuyển quá dài",
        text: `Vui lòng nhập tối đa ${COVER_LETTER_MAX_LENGTH} ký tự.`,
        confirmButtonColor: "#ef4444",
      });
      return;
    }

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
      const result = await dispatch(
        applyJob({ jobId: job.id, cvId: selectedCv.id, coverLetter })
      );

      if (applyJob.fulfilled.match(result)) {
        await Swal.fire({
          icon: "success",
          title: "Ứng tuyển thành công 🎉",
          text: "CV của bạn đã được gửi đến nhà tuyển dụng.",
          confirmButtonColor: "#2563eb",
        });

        await dispatch(checkAppliedJob(job.id));
        onAppliedSuccess?.(job.id);
        onClose();
      } else {
        const msg =
          result.payload || "Không thể gửi ứng tuyển, vui lòng thử lại sau.";
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Ứng tuyển ${job?.title || ""}`}
      width="max-w-[960px] mx-4"
    >
      {fetching ? (
        <p className="text-center text-slate-500 py-6">Đang tải danh sách CV...</p>
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
        <div className="flex max-h-[78vh] flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)] lg:gap-6">
              <section className="min-h-0 rounded-xl border border-slate-200 bg-slate-50/70 p-4 lg:h-[460px]">
                <div className="flex h-full min-h-0 flex-col gap-5">

          {/* CV Online */}
          <div className="min-h-0 shrink-0">
            <h3 className="text-slate-800 font-semibold mb-3">CV online</h3>
            {cvOnlineList.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Bạn chưa tạo CV online</p>
            ) : (
              <div className="max-h-[160px] space-y-2 overflow-x-hidden overflow-y-auto pr-1">
                {cvOnlineList.map((cv) => (
                  <label
                    key={cv.id}
                    className="flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:bg-blue-50"
                  >
                    <input
                      type="radio"
                      name="cv"
                      checked={selectedType === "online" && selectedCv?.id === cv.id}
                      onChange={() => handleSelect("online", cv)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                    />
                    <span
                      className="block min-w-0 flex-1 truncate font-medium leading-5 text-slate-700"
                      title={cv.title}
                    >
                      {cv.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* CV File */}
          <div className="flex min-h-0 flex-1 flex-col">
            <h3 className="text-slate-800 font-semibold mb-3 shrink-0">CV tải lên</h3>
            {cvFileList.length === 0 ? (
              <p className="text-sm text-slate-500 italic">Bạn chưa tải lên CV</p>
            ) : (
              <div className="min-h-0 flex-1 space-y-2 overflow-x-hidden overflow-y-auto pr-1">
                {cvFileList.map((cv) => (
                  <label
                    key={cv.id}
                    className="flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 transition hover:bg-blue-50"
                  >
                    <input
                      type="radio"
                      name="cv"
                      checked={selectedType === "file" && selectedCv?.id === cv.id}
                      onChange={() => handleSelect("file", cv)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600"
                    />
                    <span
                      className="block min-w-0 flex-1 truncate font-medium leading-5 text-slate-700"
                      title={cv.title}
                    >
                      {cv.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

                </div>
              </section>

              {/* Cover Letter */}
              <section className="flex min-w-0 flex-col lg:h-[460px]">
            <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
              <h3 className="text-slate-800 font-semibold">Thư ứng tuyển</h3>
              <span
                className={`text-sm ${
                  coverLetterTooLong ? "text-red-600" : "text-slate-500"
                }`}
              >
                {coverLetterLength} / {COVER_LETTER_MAX_LENGTH}
              </span>
            </div>
            <div className="prose min-h-[390px] max-w-none overflow-hidden rounded-lg border border-slate-200 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 lg:flex-1">
              <JoditEditor
                value={coverLetter}
                config={coverLetterEditorConfig}
                onBlur={handleCoverLetterChange}
                onChange={handleCoverLetterChange}
              />
            </div>
            {coverLetterTooLong && (
              <p className="mt-2 shrink-0 text-sm text-red-600">
                Thư ứng tuyển không được vượt quá {COVER_LETTER_MAX_LENGTH} ký tự.
              </p>
            )}
              </section>
            </div>
          </div>

          <div className="mt-5 flex shrink-0 justify-end gap-3 border-t border-slate-200 bg-white pt-4">
            <Button variant="outline" onClick={onClose}>
              {"Hu\u1ef7"}
            </Button>
            <Button
              variant="primary"
              onClick={() => setConfirmMode(true)}
              disabled={!selectedCv || coverLetterTooLong}
            >
              Xác nhận
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default ApplyJobModal;
