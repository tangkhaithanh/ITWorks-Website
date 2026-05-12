import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  fetchCandidateDetail,
  updateCandidate,
  removeCandidate,
  clearSelectedCandidate,
} from "@/features/talent-pool/talentPoolSlice";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
import CandidateInfoSummary from "@/features/talent-pool/components/CandidateInfoSummary";
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "SAVED", label: "Đã lưu" },
  { value: "CONTACTED", label: "Đã liên hệ" },
  { value: "INTERESTED", label: "Quan tâm" },
  { value: "INTERVIEW_SCHEDULED", label: "Đã hẹn phỏng vấn" },
  { value: "NOT_INTERESTED", label: "Không phù hợp" },
  { value: "HIRED", label: "Đã tuyển" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Thấp" },
  { value: "MEDIUM", label: "Trung bình" },
  { value: "HIGH", label: "Cao" },
];

export default function CandidateDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedCandidate, loading } = useSelector((state) => state.talentPool);
  const backTo = location.state?.backTo || "/recruiter/talent-pool";

  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("SAVED");
  const [priority, setPriority] = useState("MEDIUM");
  const [followUpDate, setFollowUpDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) dispatch(fetchCandidateDetail(id));
    return () => dispatch(clearSelectedCandidate());
  }, [id, dispatch]);

  useEffect(() => {
    if (selectedCandidate) {
      setNote(selectedCandidate.note || "");
      setTags((selectedCandidate.tags || []).join(", "));
      setStatus(selectedCandidate.status || "SAVED");
      setPriority(selectedCandidate.priority || "MEDIUM");
      setFollowUpDate(
        selectedCandidate.follow_up_date
          ? selectedCandidate.follow_up_date.split("T")[0]
          : ""
      );
    }
  }, [selectedCandidate]);

  const handleSave = async () => {
    const data = {
      note: note || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      status,
      priority,
      followUpDate: followUpDate || null,
    };

    setSaving(true);
    try {
      await dispatch(updateCandidate({ id, data })).unwrap();
      toast.success("Đã cập nhật ứng viên.");
    } catch (error) {
      if (error?.followUpDate) {
        toast.error("Ngày theo dõi phải là hôm nay hoặc sau hôm nay.");
      } else {
        toast.error("Không thể cập nhật ứng viên.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Xóa ứng viên này khỏi kho ứng viên?")) return;
    try {
      await dispatch(removeCandidate(id)).unwrap();
      toast.success("Đã xóa ứng viên.");
      navigate(backTo);
    } catch {
      toast.error("Không thể xóa ứng viên.");
    }
  };

  if (loading || !selectedCandidate) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const candidateName =
    selectedCandidate.candidate?.user?.full_name || `Ứng viên #${selectedCandidate.candidate_id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate(backTo)}
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">{candidateName}</h1>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Thông tin liên hệ & hồ sơ nhanh
            </label>
            <CandidateInfoSummary candidate={selectedCandidate.candidate} />
          </div>

          <hr className="border-slate-200" />

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Điểm phù hợp
            </label>
            <p className="text-sm text-slate-500">
              {selectedCandidate.match_score !== null
                ? `${Math.round(selectedCandidate.match_score * 100)}%`
                : "N/A"}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Kỹ năng phù hợp
            </label>
            <div className="flex flex-wrap gap-2">
              {(selectedCandidate.matched_skills || []).length > 0
                ? selectedCandidate.matched_skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200"
                    >
                      {s}
                    </span>
                  ))
                : <span className="text-sm text-slate-400">Không có</span>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Kỹ năng còn thiếu
            </label>
            <div className="flex flex-wrap gap-2">
              {(selectedCandidate.missing_skills || []).length > 0
                ? selectedCandidate.missing_skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-rose-200"
                    >
                      {s}
                    </span>
                  ))
                : <span className="text-sm text-slate-400">Không có</span>}
            </div>
          </div>

          <hr className="border-slate-200" />

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Ghi chú
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Ghi chú nội bộ, ứng viên không nhìn thấy..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Nhãn (phân tách bằng dấu phẩy)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="senior, backend, shortlisted"
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Trạng thái
              </label>
              <SelectInput
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Mức ưu tiên
              </label>
              <SelectInput
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={PRIORITY_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Ngày theo dõi
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-6">
          <Button
            size="sm"
            variant="outline"
            className="border-rose-200 text-rose-600 hover:bg-rose-50"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
            Xóa khỏi kho
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Đang lưu..." : "Lưu thay đổi"}
          </Button>
        </div>
      </div>
    </div>
  );
}
