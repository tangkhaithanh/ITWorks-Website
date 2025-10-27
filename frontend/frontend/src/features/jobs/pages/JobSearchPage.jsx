import { useDispatch, useSelector } from "react-redux";
import { setKeyword, setCity, searchJobs } from "../jobSearchSlice";
import { useEffect, useRef, useState } from "react";
import { useDebounce } from "@/app/hooks";
import SearchBar from "../components/SearchBar";
import { useLocation } from "react-router-dom";
import { JobCard } from "../components/JobCard";
import CandidateAPI from "@/features/candidates/CandidateAPI";
import toast from "react-hot-toast";
import FilterSidebar from "../components/FilterSidebar";
import { setFilters, clearFilters } from "../jobSearchSlice";
const NAV_HEIGHT = 72; // chiều cao navbar (ước lượng)
const TOP_STICKY = NAV_HEIGHT + 12; // khoảng cách sticky top

const JobSearchPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { keyword, city, results, loading } = useSelector((s) => s.jobSearch);
  const { user } = useSelector((s) => s.auth);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const observerRef = useRef(null);

  // 🔁 root cho IntersectionObserver = khung cuộn của job list
  const listScrollRef = useRef(null);

  const debouncedCity = useDebounce(city, 400);
  const didMountRef = useRef(false);

  // 🟢 Search
  const handleSearch = async (params = {}) => {
    const isNewSearch = !params.page || params.page === 1;
    if (isNewSearch) {
      setPage(1);
      setHasMore(true);
      // đưa scroll của danh sách về đầu mỗi lần search mới
      if (listScrollRef.current) listScrollRef.current.scrollTo({ top: 0 });
    }

    // lưu filters vào redux để phân trang không mất lọc
    if (params.__setFilters) {
      const cloned = { ...params };
      delete cloned.__setFilters;
      delete cloned.page;
      dispatch(setFilters(cloned));
    }
    if (params.__clearFilters) {
      dispatch(clearFilters());
      delete params.__clearFilters;
    }


    const res = await dispatch(
      searchJobs({
        keyword: params.keyword ?? keyword,
        city: params.city ?? city,
        page: params.page ?? 1,
        ...params,
      })
    );

    if (res.payload?.results?.length < 10) setHasMore(false);
  };

  // 🟢 Saved jobs
  const fetchSavedJobs = async () => {
    if (!user || user.role !== "candidate") return;
    try {
      const res = await CandidateAPI.getSavedJobs();
      const ids = (res.data?.data || []).map((sj) => sj.job.id);
      setSavedJobIds(ids);
    } catch (err) {
      console.error("Lỗi khi lấy saved jobs:", err);
      toast.error("Không thể tải danh sách công việc đã lưu");
    }
  };

  // 🧭 Init từ URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword") || "";
    const ct = params.get("city") || "";

    dispatch(setKeyword(kw));
    dispatch(setCity(ct));
    dispatch(clearFilters()); // <-- thêm dòng này để reset toàn bộ filter
    handleSearch({ keyword: kw, city: ct, page: 1, __clearFilters: true }); // có thể truyền thêm cờ
  }, [location.search]);

  // 🏙️ Auto search khi city đổi
  useEffect(() => {
    if (didMountRef.current) {
      if (debouncedCity) handleSearch({ city: debouncedCity, page: 1 });
      else handleSearch({ city: "", page: 1 });
    } else {
      didMountRef.current = true;
    }
  }, [debouncedCity]);

  // 🧠 Lazy loading: dùng root = listScrollRef để chỉ lắng nghe khi cuộn trong khu vực job list
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [target] = entries;
        if (target.isIntersecting && hasMore && !loading && results.length > 0 && page >= 1) {
          const nextPage = page + 1;
          setPage(nextPage);
          handleSearch({ page: nextPage });
        }
      },
      {
        root: listScrollRef.current,      // 🎯 chỉ theo dõi trong job list
        rootMargin: "0px 0px 200px 0px",  // load sớm một chút
        threshold: 0,
      }
    );
    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [observerRef.current, hasMore, loading, page, results.length]);

  // 🟢 Lấy saved jobs khi user đổi
  useEffect(() => {
    if (user?.role === "candidate") {
      fetchSavedJobs();
    }
  }, [user?.id]);

  const handleToggleSave = (jobId, isNowSaved) => {
    setSavedJobIds((prev) => (isNowSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)));
  };

   const normalizeFilters = (raw = {}) => {
    const out = { ...raw };
    // map wm/exp -> backend keys
    if (raw.wm) { out.work_modes = raw.wm; delete out.wm; }
    if (raw.exp) { out.experience_levels = raw.exp; delete out.exp; }
    // xoá các field undefined/rỗng
    Object.keys(out).forEach(k => {
      const v = out[k];
      if (v === undefined || v === null || (Array.isArray(v) && v.length === 0) || v === "") {
        delete out[k];
      }
    });
    return out;
 };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 isolate">
      <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
        🔍 Kết quả tìm kiếm việc làm
      </h1>

      {/* 🎯 Search bar phủ ngang từ mép trái filter tới mép phải job list */}
      <div className="mt-4">
        <SearchBar onSearch={(params) => handleSearch({ ...params, page: 1 })} size="md" />
      </div>

      {/* 🧱 2 cột: Filter (cuộn độc lập) + Job list (cuộn độc lập) */}
      <section
        className="
          mt-6 grid grid-cols-12 gap-5
          min-h-[calc(100dvh-180px)]
        "
      >
        {/* FILTER SIDEBAR */}
        <aside
          className={`
            col-span-12 md:col-span-4 lg:col-span-3
          `}
        >
          {/* sticky + vùng cuộn riêng */}
          <div
            className="
              sticky
              top-[84px]  /* tương đương TOP_STICKY */
            "
            style={{
              maxHeight: `calc(100dvh - ${TOP_STICKY + 24}px)`,
            }}
          >
            <div
              className="
                overflow-y-auto overscroll-contain
                rounded-2xl border border-slate-200 bg-white shadow-sm
              "
              style={{
                maxHeight: `calc(100dvh - ${TOP_STICKY + 32}px)`,
              }}
            >
              <FilterSidebar
                onApply={(raw) => handleSearch({ ...normalizeFilters(raw), page: 1, __setFilters: true })}
                onReset={() => handleSearch({ __clearFilters: true, page: 1 })}
              />
            </div>
          </div>
        </aside>

        {/* JOB LIST PANE */}
        <div
          className="
            col-span-12 md:col-span-8 lg:col-span-9
            rounded-2xl
          "
        >
          <div
            ref={listScrollRef}
            className="
              overflow-y-auto overscroll-contain
              bg-white/0
              rounded-2xl
            "
            style={{
              maxHeight: `calc(100dvh - ${TOP_STICKY + 32}px)`,
            }}
          >
            <div className="space-y-4 pr-1">
              {results.length === 0 && !loading && (
                <p className="text-center text-slate-500 py-10">
                  Không tìm thấy công việc nào.
                </p>
              )}

              {results.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSaved={savedJobIds.includes(job.id)}
                  onToggleSave={handleToggleSave}
                />
              ))}

              {loading && (
                <div className="text-center py-6 text-slate-500 animate-pulse">
                  Đang tải thêm công việc...
                </div>
              )}

              {/* Trigger lazy loading */}
              <div ref={observerRef} className="h-6" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default JobSearchPage;
