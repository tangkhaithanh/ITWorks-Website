import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import toast from "react-hot-toast";

import { useDebounce } from "@/app/hooks";
import SearchBar from "../components/SearchBar";
import { JobCard } from "../components/JobCard";
import FilterSidebar from "../components/FilterSidebar";

import CandidateAPI from "@/features/candidates/CandidateAPI";
import {
  setKeyword,
  setCity,
  searchJobs,
  setFilters,
  clearFilters,
} from "../jobSearchSlice";

const NAV_HEIGHT = 72; // chiều cao navbar (ước lượng)
const TOP_STICKY = NAV_HEIGHT + 12; // khoảng cách sticky top

const JobSearchPage = () => {
  const dispatch = useDispatch();
  const location = useLocation();

  const { keyword, city, results, loading } = useSelector(
    (s) => s.jobSearch
  );
  const { user } = useSelector((s) => s.auth);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState([]);
  const observerRef = useRef(null);

  const debouncedCity = useDebounce(city, 400);
  const didMountRef = useRef(false);

  // Hiệu ứng "merge" thanh search với header giống JobDetailPage
  const [showSearchBar, setShowSearchBar] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowSearchBar(scrollTop > 80); // cuộn xuống 1 chút thì kéo lên sát header
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Chuẩn hoá filters trước khi gửi lên backend
  const normalizeFilters = (raw = {}) => {
    const out = { ...raw };

    // map wm/exp -> backend keys
    if (raw.wm) {
      out.work_modes = raw.wm;
      delete out.wm;
    }
    if (raw.exp) {
      out.experience_levels = raw.exp;
      delete out.exp;
    }

    // xoá các field undefined/rỗng
    Object.keys(out).forEach((k) => {
      const v = out[k];
      if (
        v === undefined ||
        v === null ||
        (Array.isArray(v) && v.length === 0) ||
        v === ""
      ) {
        delete out[k];
      }
    });

    return out;
  };

  // Hàm search chính (tái sử dụng ở mọi nơi)
  const handleSearch = useCallback(
    async (params = {}) => {
      const isNewSearch = !params.page || params.page === 1;

      if (isNewSearch) {
        setPage(1);
        setHasMore(true);
        // giờ scroll là toàn trang, nên scroll cả window lên đầu
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Lưu filters vào redux để phân trang không mất lọc
      if (params.__setFilters) {
        const cloned = { ...params };
        delete cloned.__setFilters;
        delete cloned.page;
        dispatch(setFilters(cloned));
      }

      if (params.__clearFilters) {
        dispatch(clearFilters());
        const cloned = { ...params };
        delete cloned.__clearFilters;
        params = cloned;
      }

      const res = await dispatch(
        searchJobs({
          keyword: params.keyword ?? keyword,
          city: params.city ?? city,
          page: params.page ?? 1,
          ...params,
        })
      );

      const fetched = res?.payload?.results ?? [];
      // Giả định page size ~10
      if (fetched.length < 10) setHasMore(false);
    },
    [dispatch, keyword, city]
  );

  // Saved jobs
  const fetchSavedJobs = useCallback(async () => {
    if (!user || user.role !== "candidate") return;

    try {
      const res = await CandidateAPI.getSavedJobs();
      const ids = (res.data?.data || []).map((sj) => sj.job.id);
      setSavedJobIds(ids);
    } catch (err) {
      console.error("Lỗi khi lấy saved jobs:", err);
      toast.error("Không thể tải danh sách công việc đã lưu");
    }
  }, [user]);

  const handleToggleSave = (jobId, isNowSaved) => {
    setSavedJobIds((prev) =>
      isNowSaved ? [...prev, jobId] : prev.filter((id) => id !== jobId)
    );
  };

  // Init từ URL (keyword, city)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const kw = params.get("keyword") || "";
    const ct = params.get("city") || "";

    dispatch(setKeyword(kw));
    dispatch(setCity(ct));
    dispatch(clearFilters());

    handleSearch({
      keyword: kw,
      city: ct,
      page: 1,
      __clearFilters: true,
    });
  }, [location.search, dispatch, handleSearch]);

  // Auto search khi city đổi (debounce)
  useEffect(() => {
    if (didMountRef.current) {
      if (debouncedCity) {
        handleSearch({ city: debouncedCity, page: 1 });
      } else {
        handleSearch({ city: "", page: 1 });
      }
    } else {
      didMountRef.current = true;
    }
  }, [debouncedCity, handleSearch]);

  // Lấy saved jobs khi user đổi
  useEffect(() => {
    if (user?.role === "candidate") {
      fetchSavedJobs();
    }
  }, [user?.id, user?.role, fetchSavedJobs]);

  // Lazy loading: IntersectionObserver với root = viewport (toàn trang cuộn)
  useEffect(() => {
    const target = observerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (
          entry.isIntersecting &&
          hasMore &&
          !loading &&
          results.length > 0 &&
          page >= 1
        ) {
          const nextPage = page + 1;
          setPage(nextPage);
          handleSearch({ page: nextPage });
        }
      },
      {
        root: null, // viewport, vì giờ cuộn là toàn trang
        rootMargin: "0px 0px 200px 0px", // load sớm một chút
        threshold: 0,
      }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, page, results.length, handleSearch]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 relative">
      {/* 🟦 Thanh search cố định giống JobDetailPage */}
      <div
        className={`fixed left-0 w-full 
          bg-gradient-to-r from-blue-600/95 via-blue-800/95 to-blue-900/95
          backdrop-blur-lg border-b border-blue-500/20
          shadow-[0_4px_20px_rgba(40,80,200,0.35)]
          py-2 transition-all duration-500 ease-in-out
          ${showSearchBar ? "top-0 z-[60]" : "top-16 z-40"}`}
      >
        <div className="mx-auto max-w-6xl px-4">
          <SearchBar
            onSearch={(params) => handleSearch({ ...params, page: 1 })}
            size="sm"
            compact
          />
        </div>
      </div>

      {/* ✅ Container chính, padding-top để không bị thanh search đè lên */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 pt-[120px] pb-8 isolate">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          🔍 Kết quả tìm kiếm việc làm
        </h1>

        {/* 🧱 2 cột: Filter (cuộn độc lập) + Job list (cuộn theo trang) */}
        <section
          className="
            mt-6 grid grid-cols-12 gap-5
            min-h-[calc(100dvh-180px)]
          "
        >
          {/* FILTER SIDEBAR */}
          <aside className="col-span-12 md:col-span-4 lg:col-span-3">
            <div
              className="sticky top-[84px]"
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
                  onApply={(raw) =>
                    handleSearch({
                      ...normalizeFilters(raw),
                      page: 1,
                      __setFilters: true,
                    })
                  }
                  onReset={() =>
                    handleSearch({
                      __clearFilters: true,
                      page: 1,
                    })
                  }
                />
              </div>
            </div>
          </aside>


          {/* JOB LIST: giờ không còn overflow riêng, cuộn theo toàn trang */}
          <div className="col-span-12 md:col-span-8 lg:col-span-9 rounded-2xl">
            <div className="bg-white/0 rounded-2xl">
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
    </div>
  );
};

export default JobSearchPage;
