import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { saveCandidate } from "@/features/talent-pool/talentPoolSlice";
import TalentPoolAPI from "@/features/talent-pool/talentPoolAPI";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import JobAPI from "@/features/jobs/JobAPI";
import MatchDetailDrawer from "@/features/matching/components/MatchDetailDrawer";
import MatchingJobSelectionView from "@/features/matching/components/MatchingJobSelectionView";
import MatchingWorkspaceView from "@/features/matching/components/MatchingWorkspaceView";
import MatchingAPI from "@/features/matching/MatchingAPI";
import {
  DEFAULT_MATCH_FILTERS,
  PAGE_SIZE,
} from "@/features/matching/constants/matchingWorkspace.constants";
import {
  formatExperienceRequired,
  getJobSkills,
  getMatchApplicationId,
  getMatchCandidateId,
  matchHasSelectedSkills,
  normalizeStatus,
  parseCityLabel,
  sortJobs,
  sortMatches,
  unwrapApiPayload,
} from "@/features/matching/utils/matchingWorkspace.utils";

function MatchingWorkspaceLoadingState() {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <RefreshCw className="h-6 w-6 animate-spin" />
      </div>
      <h2 className="mt-4 text-xl font-bold text-slate-900">Đang mở workspace matching</h2>
      <p className="mt-2 text-sm text-slate-500">
        Mình đang tải thông tin job để bạn chọn mode và bắt đầu matching.
      </p>
    </div>
  );
}

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

export default function MatchingWorkspacePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const selectedJobId = searchParams.get("jobId");
  const requestedMode = searchParams.get("mode");
  const isWorkspaceView = Boolean(selectedJobId);

  const [jobSearch, setJobSearch] = useState("");
  const [jobStatus, setJobStatus] = useState("active");
  const [jobSort, setJobSort] = useState("created_desc");
  const [jobs, setJobs] = useState([]);
  const [jobsTotal, setJobsTotal] = useState(0);
  const [jobsPage, setJobsPage] = useState(1);
  const [jobsLoading, setJobsLoading] = useState(false);

  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedJobLoading, setSelectedJobLoading] = useState(false);
  const [activeMode, setActiveMode] = useState("job_rank_applicants");
  const [resultSort, setResultSort] = useState("overall_score");
  const [matchingLoading, setMatchingLoading] = useState(false);
  const [matchingRefreshing, setMatchingRefreshing] = useState(false);
  const [rankMatches, setRankMatches] = useState([]);
  const [talentMatches, setTalentMatches] = useState([]);
  const [rankTotal, setRankTotal] = useState(0);
  const [talentTotal, setTalentTotal] = useState(0);
  const [loadedModes, setLoadedModes] = useState({
    job_rank_applicants: false,
    job_find_talent: false,
  });

  const [draftFilters, setDraftFilters] = useState(DEFAULT_MATCH_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_MATCH_FILTERS);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [drawerDetail, setDrawerDetail] = useState(null);

  const totalJobPages = Math.max(1, Math.ceil(jobsTotal / PAGE_SIZE));
  const availableSkills = getJobSkills(selectedJob);
  const hasLoadedCurrentMode = loadedModes[activeMode];
  const initialMode =
    requestedMode === "job_find_talent" || requestedMode === "job_rank_applicants"
      ? requestedMode
      : "job_rank_applicants";

  const resetMatchingState = () => {
    setActiveMode("job_rank_applicants");
    setResultSort("overall_score");
    setMatchingLoading(false);
    setMatchingRefreshing(false);
    setRankMatches([]);
    setTalentMatches([]);
    setRankTotal(0);
    setTalentTotal(0);
    setLoadedModes({
      job_rank_applicants: false,
      job_find_talent: false,
    });
    setDrawerOpen(false);
    setSelectedMatch(null);
    setDrawerLoading(false);
    setDrawerDetail(null);
    setDraftFilters(DEFAULT_MATCH_FILTERS);
    setAppliedFilters(DEFAULT_MATCH_FILTERS);
  };

  const loadJobs = async ({ page = 1, preserveSelection = false } = {}) => {
    try {
      setJobsLoading(true);

      const res = await JobAPI.getByCompany({
        page,
        limit: PAGE_SIZE,
        search: jobSearch.trim() || undefined,
        status: jobStatus || undefined,
      });

      const data = res.data?.data || res.data || {};
      const summaries = data.items || [];

      const hydratedJobs = await Promise.all(
        summaries.map(async (job) => {
          try {
            const detailRes = await JobAPI.getJobToEdit(job.id);
            return { ...job, ...(detailRes.data?.data || {}), _count: job._count };
          } catch {
            return job;
          }
        }),
      );

      const sortedJobs = sortJobs(hydratedJobs, jobSort);
      setJobs(sortedJobs);
      setJobsTotal(data.total || 0);
      setJobsPage(page);

      if (preserveSelection && selectedJob) {
        const updatedSelection = sortedJobs.find((job) => job.id === selectedJob.id);
        if (updatedSelection) setSelectedJob(updatedSelection);
      }
    } catch (error) {
      console.error("Không thể tải danh sách job matching:", error);
      toast.error("Không thể tải danh sách job để matching.");
    } finally {
      setJobsLoading(false);
    }
  };

  // V2 fix: candidateMap chỉ lưu candidate (không lưu cv_url),
  // vì cvPath sẽ lấy từ match.file_url trực tiếp
  const enrichApplicantMatches = (matches, jobApplications, allApplications, job) => {
    const applicationsById = new Map(jobApplications.map((item) => [Number(item.id), item]));
    const candidateMap = new Map();

    allApplications.forEach((item) => {
      const candidateId = Number(item?.candidate?.id);
      if (!candidateId || candidateMap.has(candidateId)) return;
      candidateMap.set(candidateId, { candidate: item.candidate });
    });

    return matches.map((match, index) => {
      const resolvedApplicationId = getMatchApplicationId(match);
      const application = applicationsById.get(resolvedApplicationId);
      const fallbackCandidate = candidateMap.get(
        Number(match.source_candidate_id || match.candidate_id),
      );
      const candidateUser = application?.candidate?.user || fallbackCandidate?.candidate?.user;

      return {
        ...match,
        rankOrder: index,
        displayName:
          candidateUser?.full_name ||
          `Ứng viên #${match.source_candidate_id || match.candidate_id || match.id}`,
        avatarUrl: candidateUser?.avatar_url || null,
        locationLabel: parseCityLabel(job?.location?.full || job?.location_full),
        experienceLabel: formatExperienceRequired(job),
        subtitle: `Ứng viên đã apply cho ${job?.title || "job này"}`,
        applicationStatus: application?.status || normalizeStatus(match.status),
        // V2 fix: dùng match.file_url thay vì application.cv_url
        cvPath: match.file_url || null,
        resolvedApplicationId,
      };
    });
  };

  // V2 fix: candidateMap chỉ lưu candidate, cvPath từ match.file_url
  // V1 feature: nhận thêm savedTalentMap để đánh dấu isSavedToTalentPool
  const enrichTalentMatches = (matches, allApplications, job, savedTalentMap = new Map()) => {
    const candidateMap = new Map();

    allApplications.forEach((item) => {
      const candidateId = Number(item?.candidate?.id);
      if (!candidateId || candidateMap.has(candidateId)) return;
      candidateMap.set(candidateId, { candidate: item.candidate });
    });

    return matches.map((match, index) => {
      const fallbackCandidate = candidateMap.get(
        Number(match.source_candidate_id || match.candidate_id),
      );
      const candidateUser = match.candidate?.user || fallbackCandidate?.candidate?.user;
      const candidateId = getMatchCandidateId(match);
      const savedRecord = candidateId ? savedTalentMap.get(candidateId) : null;

      return {
        ...match,
        rankOrder: index,
        displayName:
          candidateUser?.full_name ||
          `Talent #${match.source_candidate_id || match.candidate_id || match.id}`,
        avatarUrl: candidateUser?.avatar_url || null,
        locationLabel: parseCityLabel(job?.location?.full || job?.location_full),
        experienceLabel: formatExperienceRequired(job),
        subtitle: "Ứng viên từ CV pool",
        applicationStatus: null,
        // V2 fix: dùng match.file_url
        cvPath: match.file_url || null,
        // V1 feature: talent pool saved state
        isSavedToTalentPool: Boolean(savedRecord),
        savedTalentPoolId: savedRecord?.id || null,
      };
    });
  };

  const loadMatchingResults = async (job, mode, isInitial = false) => {
    if (!job?.id || !mode) return;

    try {
      if (isInitial) setMatchingLoading(true);
      else setMatchingRefreshing(true);

      if (mode === "job_rank_applicants") {
        const [rankRes, jobApplicationsRes, allApplicationsRes] = await Promise.all([
          MatchingAPI.rankApplicants(job.id),
          ApplicationAPI.getByCompany({ page: 1, limit: 200, jobId: job.id }),
          ApplicationAPI.getByCompany({ page: 1, limit: 200 }),
        ]);

        const rankData = unwrapApiPayload(rankRes);
        const jobApplications = jobApplicationsRes.data?.data?.items || [];
        const allApplications = allApplicationsRes.data?.data?.items || [];
        const rankMatchesData = Array.isArray(rankData.matches) ? rankData.matches : [];

        setRankMatches(
          enrichApplicantMatches(rankMatchesData, jobApplications, allApplications, job),
        );
        setRankTotal(Number(rankData.total ?? rankMatchesData.length ?? 0));
      } else {
        // V1 feature: fetch talentPoolRes để build savedTalentMap
        const [talentRes, allApplicationsRes, talentPoolRes] = await Promise.all([
          MatchingAPI.findTalent(job.id),
          ApplicationAPI.getByCompany({ page: 1, limit: 200 }),
          TalentPoolAPI.getByJob(job.id, { page: 1, limit: 500 }),
        ]);

        const talentData = unwrapApiPayload(talentRes);
        const allApplications = allApplicationsRes.data?.data?.items || [];
        const savedTalentMap = buildSavedTalentMap(unwrapTalentPoolList(talentPoolRes));
        const talentMatchesData = Array.isArray(talentData.matches) ? talentData.matches : [];

        setTalentMatches(enrichTalentMatches(talentMatchesData, allApplications, job, savedTalentMap));
        setTalentTotal(Number(talentData.total ?? talentMatchesData.length ?? 0));
      }

      setLoadedModes((prev) => ({ ...prev, [mode]: true }));
      setDrawerOpen(false);
      setSelectedMatch(null);
      setDrawerDetail(null);
      setDraftFilters(DEFAULT_MATCH_FILTERS);
      setAppliedFilters(DEFAULT_MATCH_FILTERS);
    } catch (error) {
      console.error("Không thể tải dữ liệu matching:", error);
      toast.error("Không thể tải kết quả matching cho job này.");
    } finally {
      setMatchingLoading(false);
      setMatchingRefreshing(false);
    }
  };

  const handleSearchJobs = () => loadJobs({ page: 1 });

  const handleOpenWorkspace = (job) => {
    navigate(`/recruiter/candidate-search?jobId=${job.id}`);
  };

  const handleStartMatch = async () => {
    if (!selectedJob) return;
    await loadMatchingResults(selectedJob, activeMode, !hasLoadedCurrentMode);
  };

  // V1 feature: navigate to talent pool page
  const handleOpenTalentPool = () => {
    if (!selectedJob?.id) return;
    navigate(`/recruiter/jobs/${selectedJob.id}/talent-pool`, {
      state: {
        backTo: `/recruiter/candidate-search?jobId=${selectedJob.id}&mode=${activeMode}`,
        backLabel: "Matching",
      },
    });
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
      const res = await ApplicationAPI.getDetail(applicationId);
      setDrawerDetail(res.data?.data || null);
    } catch (error) {
      console.error("Không thể tải chi tiết application:", error);
      toast.error("Không thể tải chi tiết hồ sơ ứng viên.");
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleOpenCv = (match) => {
    // V2 fix: ưu tiên match.file_url, fallback match.cvPath
    // Không dùng buildBackendUrl vì file_url đã là URL đầy đủ
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
      toast("Ứng viên này chưa có application trong hệ thống.");
      return;
    }

    navigate(`/recruiter/applications/${applicationId}`);
  };

  // V1 feature: full save to talent pool with Redux dispatch
  const handleSaveToTalentPool = async (match) => {
    if (match.isSavedToTalentPool) {
      toast("Ứng viên này đã có trong kho ứng viên.");
      return;
    }

    const candidateId = getMatchCandidateId(match);
    if (!candidateId) {
      toast.error("Không thể xác định ứng viên để lưu.");
      return;
    }

    try {
      await dispatch(
        saveCandidate({
          candidateId: String(candidateId),
          jobId: selectedJob?.id ? String(selectedJob.id) : undefined,
          matchScore: match.overall_score ?? undefined,
          matchedSkills: match.matched_skills || [],
          missingSkills: match.missing_skills || [],
        }),
      ).unwrap();

      const updateMatch = (item) =>
        getMatchCandidateId(item) === Number(candidateId)
          ? { ...item, isSavedToTalentPool: true }
          : item;

      setTalentMatches((prev) => prev.map(updateMatch));
      setRankMatches((prev) => prev.map(updateMatch));

      toast((t) => (
        <div className="flex flex-col gap-2">
          <span>Đã lưu {match.displayName || "ứng viên"} vào kho ứng viên.</span>
          <button
            type="button"
            onClick={() => {
              toast.dismiss(t.id);
              handleOpenTalentPool();
            }}
            className="text-left text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            Xem kho ứng viên
          </button>
        </div>
      ));
    } catch (error) {
      const errorMessage = String(error?.message || error?.error || "").toLowerCase();
      if (
        error?.statusCode === 409 ||
        error?.status === 409 ||
        errorMessage.includes("already saved") ||
        errorMessage.includes("đã có")
      ) {
        const updateMatch = (item) =>
          getMatchCandidateId(item) === Number(candidateId)
            ? { ...item, isSavedToTalentPool: true }
            : item;

        setTalentMatches((prev) => prev.map(updateMatch));
        setRankMatches((prev) => prev.map(updateMatch));
        toast.error("Ứng viên này đã có trong kho ứng viên.");
      } else {
        toast.error("Không thể lưu ứng viên vào kho ứng viên.");
      }
    }
  };

  const handleReject = async (match) => {
    const applicationId = getMatchApplicationId(match);
    if (!applicationId) {
      // V1: message rõ hơn cho talent pool case
      toast("Hiện chưa có API từ chối cho kho ứng viên.");
      return;
    }

    if (!window.confirm("Bạn có chắc muốn từ chối ứng viên này?")) return;

    try {
      await ApplicationAPI.reject(applicationId);
      const updateMatch = (item) =>
        getMatchApplicationId(item) === applicationId
          ? { ...item, applicationStatus: "rejected" }
          : item;

      setRankMatches((prev) => prev.map(updateMatch));
      setTalentMatches((prev) => prev.map(updateMatch));

      if (getMatchApplicationId(selectedMatch) === applicationId) {
        setSelectedMatch((prev) => (prev ? { ...prev, applicationStatus: "rejected" } : prev));
      }

      toast.success("Đã cập nhật trạng thái ứng viên.");
    } catch (error) {
      console.error("Không thể reject application:", error);
      toast.error("Không thể reject ứng viên lúc này.");
    }
  };

  const currentMatches = activeMode === "job_rank_applicants" ? rankMatches : talentMatches;

  const filteredMatches = sortMatches(
    currentMatches.filter((item) => {
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
  );

  useEffect(() => {
    loadJobs({ page: 1 });
    // `loadJobs` depends on filters/search state, but this effect is only for initial load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (jobs.length > 0) {
      setJobs((prev) => sortJobs(prev, jobSort));
    }
  }, [jobSort, jobs.length]);

  useEffect(() => {
    let cancelled = false;

    const loadSelectedJob = async () => {
      if (!selectedJobId) {
        setSelectedJob(null);
        setSelectedJobLoading(false);
        resetMatchingState();
        return;
      }

      try {
        setSelectedJobLoading(true);
        resetMatchingState();
        // V1 feature: set initialMode từ query param trước khi load
        setActiveMode(initialMode);
        const detailRes = await JobAPI.getJobToEdit(selectedJobId);

        if (cancelled) return;
        setSelectedJob(detailRes.data?.data || null);
      } catch (error) {
        console.error("Không thể tải thông tin job matching:", error);
        toast.error("Không thể mở workspace matching cho job này.");
        if (!cancelled) {
          navigate("/recruiter/candidate-search", { replace: true });
        }
      } finally {
        if (!cancelled) {
          setSelectedJobLoading(false);
        }
      }
    };

    loadSelectedJob();

    return () => {
      cancelled = true;
    };
  }, [initialMode, navigate, selectedJobId]);

  return (
    <div className="min-h-screen bg-slate-50/60 pb-16">
      {!isWorkspaceView ? (
        <MatchingJobSelectionView
          jobsTotal={jobsTotal}
          jobSearch={jobSearch}
          onJobSearchChange={setJobSearch}
          jobStatus={jobStatus}
          onJobStatusChange={setJobStatus}
          jobSort={jobSort}
          onJobSortChange={setJobSort}
          onSearch={handleSearchJobs}
          jobsLoading={jobsLoading}
          jobs={jobs}
          jobsPage={jobsPage}
          totalJobPages={totalJobPages}
          onPageChange={(page) => loadJobs({ page })}
          onOpenWorkspace={handleOpenWorkspace}
        />
      ) : (
        <>
          <section className="space-y-6">
            {selectedJobLoading || !selectedJob ? (
              <MatchingWorkspaceLoadingState />
            ) : (
              <MatchingWorkspaceView
                selectedJob={selectedJob}
                availableSkills={availableSkills}
                activeMode={activeMode}
                onActiveModeChange={setActiveMode}
                loadedModes={loadedModes}
                rankTotal={rankTotal}
                talentTotal={talentTotal}
                matchingLoading={matchingLoading}
                matchingRefreshing={matchingRefreshing}
                hasLoadedCurrentMode={hasLoadedCurrentMode}
                onStartMatch={handleStartMatch}
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
                onRefreshMatch={() => loadMatchingResults(selectedJob, activeMode, false)}
                onViewDetail={handleOpenDetail}
                onReject={handleReject}
                onManageApplication={handleManageApplication}
                onOpenCv={handleOpenCv}
                onSaveToTalentPool={handleSaveToTalentPool}
                onOpenTalentPool={handleOpenTalentPool}
                onBackToJobs={() => navigate("/recruiter/candidate-search")}
              />
            )}
          </section>

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
        </>
      )}
    </div>
  );
}
