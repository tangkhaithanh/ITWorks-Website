import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import { Loader2, ArrowLeft, Trash2 } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "SAVED", label: "Saved" },
  { value: "CONTACTED", label: "Contacted" },
  { value: "INTERESTED", label: "Interested" },
  { value: "INTERVIEW_SCHEDULED", label: "Interview Scheduled" },
  { value: "NOT_INTERESTED", label: "Not Interested" },
  { value: "HIRED", label: "Hired" },
];

const PRIORITY_OPTIONS = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export default function CandidateDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { selectedCandidate, loading } = useSelector((state) => state.talentPool);

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
      toast.success("Candidate updated.");
    } catch (error) {
      if (error?.followUpDate) {
        toast.error("Follow-up date must be today or later.");
      } else {
        toast.error("Failed to update candidate.");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm("Remove this candidate from talent pool?")) return;
    try {
      await dispatch(removeCandidate(id)).unwrap();
      toast.success("Candidate removed.");
      navigate("/recruiter/talent-pool");
    } catch {
      toast.error("Failed to remove candidate.");
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
    selectedCandidate.candidate?.user?.full_name || `Candidate #${selectedCandidate.candidate_id}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => navigate("/recruiter/talent-pool")}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">{candidateName}</h1>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-5">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Match Score
            </label>
            <p className="text-sm text-slate-500">
              {selectedCandidate.match_score !== null
                ? `${Math.round(selectedCandidate.match_score * 100)}%`
                : "N/A"}
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Matched Skills
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
                : <span className="text-sm text-slate-400">None</span>}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Missing Skills
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
                : <span className="text-sm text-slate-400">None</span>}
            </div>
          </div>

          <hr className="border-slate-200" />

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Note
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder="Internal note (not visible to candidates)..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700">
              Tags (comma-separated)
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
                Status
              </label>
              <SelectInput
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={STATUS_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Priority
              </label>
              <SelectInput
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                options={PRIORITY_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Follow-up Date
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
            Remove from Pool
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
