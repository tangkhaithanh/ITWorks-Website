import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { Loader2, UserRoundSearch, X } from "lucide-react";

import ApplicationAPI from "@/features/applications/ApplicationAPI";
import JobAPI from "@/features/jobs/JobAPI";
import MatchDetailDrawer from "@/features/matching/components/MatchDetailDrawer";
import MatchingWorkspaceView from "@/features/matching/components/MatchingWorkspaceView";
import {
  DEFAULT_MATCH_FILTERS,
} from "@/features/matching/constants/matchingWorkspace.constants";
import {
  formatExperienceRequired,
  getJobSkills,
  getMatchApplicationId,
  getMatchCandidateId,
  matchHasSelectedSkills,
  normalizeStatus,
  parseCityLabel,
  sortMatches,
} from "@/features/matching/utils/matchingWorkspace.utils";
import TalentPoolAPI from "@/features/talent-pool/talentPoolAPI";
import { saveCandidate } from "@/features/talent-pool/talentPoolSlice";

const ACTION_MODES = {
  RANK_APPLICANTS: "job_rank_applicants",
  FIND_TALENT: "job_find_talent",
};

const getMatches = (session) =>
  Array.isArray(session?.response?.matches) ? session.response.matches : [];

const unwrapTalentPoolList = (response) => {
  let current = response?.data;

  for (let depth = 0; depth < 4; depth += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }

    if (Array.isArray(current.data)) {
      return current.data;
    }

    if (Array.isArray(current.items)) {
      return current.items;
    }

    current = current.data;
  }

  return [];
};

const buildSavedTalentMap = (items) =>
  new Map(
    items
      .map((item) => {
        const candidateId = Number(item?.candidate_id ?? item?.candidate?.id);
        return Number.isFinite(candidateId) && candidateId > 0
          ? [candidateId, item]
          : null;
      })
      .filter(Boolean),
  );

const getCandidateName = (match, index) =>
  match.displayName ||
  match.candidate_name ||
  match.full_name ||
  match.name ||
  `Ứng viên #${
    match.source_candidate_id || match.candidate_id || index + 1
  }`;

const buildFallbackJob = (session) => ({
  id: session?.job?.id || "history",
  title: session?.job?.title || "Tin tuyển dụng",
  status: "active",
  location_full: "",
  negotiable: true,
  created_at: session?.searchedAt,
  _count: {
    applications:
      session?.actionType === "RANK_APPLICANTS"
        ? Number(session?.response?.total ?? getMatches(session).length)
        : 0,
  },
});

const toSavedMatch = (match, index, job, mode, savedTalentMap = new Map()) => {
  const candidateId = getMatchCandidateId(match);
  const savedRecord = candidateId ? savedTalentMap.get(candidateId) : null;

  return {
    ...match,
    rankOrder: index,
    displayName: getCandidateName(match, index),
    avatarUrl: match.avatarUrl || match.avatar_url || null,
    locationLabel:
      match.locationLabel ||
      match.location_label ||
      parseCityLabel(job?.location?.full || job?.location_full),
    experienceLabel:
      match.experienceLabel ||
      match.experience_label ||
      formatExperienceRequired(job),
    subtitle:
      match.subtitle ||
      (mode === "job_rank_applicants"
        ? `Ứng viên đã ứng tuyển ${job?.title || "tin tuyển dụng này"}`
        : "Ứng viên từ kho CV"),
    applicationStatus: match.applicationStatus || normalizeStatus(match.status),
    cvPath: match.cvPath || match.file_url || null,
    isSavedToTalentPool: Boolean(savedRecord || match.isSavedToTalentPool),
    savedTalentPoolId: savedRecord?.id || match.savedTalentPoolId || null,
  };
};

function DetailHeader({ onClose }) {
  return (
    <div className="sticky top-0 z-20 flex justify-end border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur">
      <button
        type="button"
        onClick={onClose}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
        aria-label="Đóng chi tiết phiên"
        title="Đóng chi tiết"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function SessionPlaceholder({ loading, error }) {
  if (loading) {
    return (
      <div className="flex min-h-[420px] items-center justify-center text-blue-600">
        <Loader2 className="h-9 w-9 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        <UserRoundSearch className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-bold text-slate-900">
        {error ? "Không tải được phiên tìm kiếm" : "Chọn một phiên tìm kiếm"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-slate-500">
        {error ||
          "Kết quả đã lưu sẽ mở tại đây mà không chạy lại quá trình tìm kiếm."}
      </p>
    </div>
  );
}

export default function SavedMatchingSessionDetail({
  session,
  loading,
  error,
  onClose,
}) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const activeMode = ACTION_MODES[session?.actionType] || "job_rank_applicants";
  const [selectedJob, setSelectedJob] = useState(null);
  const [savedMatches, setSavedMatches] = useState([]);
  const [resultSort, setResultSort] = useState("overall_score");
  const [draftFilters, setDraftFilters] = useState(DEFAULT_MATCH_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_MATCH_FILTERS);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [drawerDetail, setDrawerDetail] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fallbackJob = session ? buildFallbackJob(session) : null;
    setSelectedJob(fallbackJob);
    setResultSort("overall_score");
    setDraftFilters(DEFAULT_MATCH_FILTERS);
    setAppliedFilters(DEFAULT_MATCH_FILTERS);
    setDrawerOpen(false);
    setSelectedMatch(null);
    setDrawerDetail(null);

    if (!session) {
      setSavedMatches([]);
      return undefined;
    }

    setSavedMatches(
      getMatches(session).map((match, index) =>
        toSavedMatch(match, index, fallbackJob, activeMode),
      ),
    );

    const loadLiveJob = async () => {
      if (!session.job?.id) return;

      try {
        const [jobResponse, talentPoolResponse] = await Promise.all([
          JobAPI.getJobToEdit(session.job.id),
          TalentPoolAPI.getByJob(session.job.id, { page: 1, limit: 500 }),
        ]);
        const job = jobResponse.data?.data || fallbackJob;
        const savedTalentMap = buildSavedTalentMap(
          unwrapTalentPoolList(talentPoolResponse),
        );
        if (cancelled) return;

        setSelectedJob(job);
        setSavedMatches(
          getMatches(session).map((match, index) =>
            toSavedMatch(match, index, job, activeMode, savedTalentMap),
          ),
        );
      } catch {
        // The saved snapshot remains usable when current job context is unavailable.
      }
    };

    loadLiveJob();

    return () => {
      cancelled = true;
    };
  }, [activeMode, session]);

  const filteredMatches = useMemo(
    () =>
      sortMatches(
        savedMatches.filter((item) => {
          const minScore = Number(appliedFilters.minScore || 0) / 100;
          if (Number(item.overall_score || 0) < minScore) return false;

          if (
            appliedFilters.matchedSkills.length > 0 &&
            !matchHasSelectedSkills(item.matched_skills, appliedFilters.matchedSkills)
          ) {
            return false;
          }

          if (
            activeMode === "job_rank_applicants" &&
            appliedFilters.status !== "all" &&
            normalizeStatus(item.applicationStatus) !== appliedFilters.status
          ) {
            return false;
          }

          return true;
        }),
        resultSort,
      ),
    [activeMode, appliedFilters, resultSort, savedMatches],
  );

  const updateMatch = (candidate, update) => {
    const applicationId = getMatchApplicationId(candidate);
    const candidateId = getMatchCandidateId(candidate);
    const matchesCandidate = (item) =>
      (applicationId && getMatchApplicationId(item) === applicationId) ||
      (candidateId && getMatchCandidateId(item) === candidateId);

    setSavedMatches((current) =>
      current.map((item) => (matchesCandidate(item) ? { ...item, ...update } : item)),
    );
    setSelectedMatch((current) =>
      current && matchesCandidate(current) ? { ...current, ...update } : current,
    );
  };

  const handleOpenDetail = async (match) => {
    const applicationId = getMatchApplicationId(match);
    setSelectedMatch(match);
    setDrawerDetail(null);
    setDrawerOpen(true);

    if (!applicationId) {
      setDrawerLoading(false);
      return;
    }

    try {
      setDrawerLoading(true);
      const response = await ApplicationAPI.getDetail(applicationId);
      setDrawerDetail(response.data?.data || null);
    } catch {
      toast.error("Không thể tải chi tiết hồ sơ ứng viên.");
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenCv = (match) => {
    const cvPath = match?.file_url || match?.cvPath;

    if (!cvPath) {
      toast("CV hiện chưa có đường dẫn xem trực tiếp.");
      return;
    }

    window.open(cvPath, "_blank", "noopener,noreferrer");
  };

  const handleManageApplication = (match) => {
    const applicationId = getMatchApplicationId(match);

    if (!applicationId) {
      toast("Ứng viên này chưa có đơn ứng tuyển trong hệ thống.");
      return;
    }

    navigate(`/recruiter/applications/${applicationId}`);
  };

  const handleReject = async (match) => {
    const applicationId = getMatchApplicationId(match);

    if (!applicationId) {
      toast("Hiện chưa có API từ chối cho ứng viên này.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn từ chối ứng viên này?")) return;

    try {
      await ApplicationAPI.reject(applicationId);
      updateMatch(match, { applicationStatus: "rejected" });
      toast.success("Đã cập nhật trạng thái ứng viên.");
    } catch {
      toast.error("Không thể từ chối ứng viên lúc này.");
    }
  };

  const handleSaveToTalentPool = async (match) => {
    if (match.isSavedToTalentPool) {
      toast("Ứng viên này đã có trong kho ứng viên.");
      return;
    }

    const candidateId = getMatchCandidateId(match);
    if (!candidateId || !selectedJob?.id || selectedJob.id === "history") {
      toast.error("Không đủ thông tin để lưu ứng viên.");
      return;
    }

    try {
      await dispatch(
        saveCandidate({
          candidateId: String(candidateId),
          jobId: String(selectedJob.id),
          matchScore: match.overall_score ?? undefined,
          matchedSkills: match.matched_skills || [],
          missingSkills: match.missing_skills || [],
        }),
      ).unwrap();
      updateMatch(match, { isSavedToTalentPool: true });
      toast.success("Đã lưu ứng viên vào kho ứng viên.");
    } catch {
      toast.error("Không thể lưu ứng viên vào kho ứng viên.");
    }
  };

  const handleOpenTalentPool = () => {
    if (!selectedJob?.id || selectedJob.id === "history") return;
    navigate(`/recruiter/jobs/${selectedJob.id}/talent-pool`);
  };

  if (!session || !selectedJob) {
    return (
      <div className="flex h-full flex-col">
        <DetailHeader onClose={onClose} />
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <SessionPlaceholder loading={loading} error={error} />
        </div>
      </div>
    );
  }

  const loadedModes = {
    job_rank_applicants: activeMode === "job_rank_applicants",
    job_find_talent: activeMode === "job_find_talent",
  };
  const total = Number(session.response?.total ?? savedMatches.length);

  return (
    <div className="flex h-full flex-col">
      <DetailHeader onClose={onClose} />
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        <MatchingWorkspaceView
          selectedJob={selectedJob}
          availableSkills={getJobSkills(selectedJob)}
          activeMode={activeMode}
          onActiveModeChange={() => {}}
          loadedModes={loadedModes}
          rankTotal={activeMode === "job_rank_applicants" ? total : 0}
          talentTotal={activeMode === "job_find_talent" ? total : 0}
          matchingLoading={false}
          matchingRefreshing={false}
          hasLoadedCurrentMode
          onStartMatch={() => {}}
          draftFilters={draftFilters}
          onDraftFiltersChange={setDraftFilters}
          onApplyFilters={() => setAppliedFilters({ ...draftFilters })}
          onResetFilters={() => {
            setDraftFilters(DEFAULT_MATCH_FILTERS);
            setAppliedFilters(DEFAULT_MATCH_FILTERS);
          }}
          filteredMatches={filteredMatches}
          resultSort={resultSort}
          onResultSortChange={setResultSort}
          onRefreshMatch={() => {}}
          onViewDetail={handleOpenDetail}
          onReject={handleReject}
          onManageApplication={handleManageApplication}
          onOpenCv={handleOpenCv}
          onSaveToTalentPool={handleSaveToTalentPool}
          onOpenTalentPool={handleOpenTalentPool}
          onBackToJobs={() => {}}
          allowLiveMatchingControls={false}
          showFilters={false}
        />
      </div>

      <MatchDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        match={selectedMatch}
        detail={drawerDetail}
        loading={drawerLoading}
        onOpenCv={handleOpenCv}
        onOpenApplication={handleManageApplication}
        onReject={handleReject}
      />
    </div>
  );
}
