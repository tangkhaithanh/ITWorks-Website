import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import JobAPI from "@/features/jobs/JobAPI";
import SearchBar from "@/features/jobs/components/SearchBar";
import JobHeader from "@/features/jobs/components/JobHeader";
import JobCompanyInfo from "@/features/jobs/components/JobCompanyInfo";
import JobDescription from "@/features/jobs/components/JobDescription";
import JobRequirements from "@/features/jobs/components/JobRequirements";
import JobExtraInfo from "@/features/jobs/components/JobExtraInfo";

const JobDetailPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSearchBar, setShowSearchBar] = useState(false);

  const isSavedFromCard = location.state?.isSaved ?? false;

  const handleSearch = ({ keyword, city }) => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (city) params.set("city", city);
    navigate(`/jobs/search?${params.toString()}`);
  };

  // Fetch job detail
  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await JobAPI.getDetail(id);
        setJob(res.data.data);
      } catch (err) {
        console.error("Lỗi khi tải job:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id]);

  // Scroll logic để merge header
  useEffect(() => {
    const handleScroll = () => {
      setShowSearchBar(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading)
    return (
        <div className="p-10 text-center text-slate-500">Đang tải...</div>
    );

  if (!job)
    return (
        <div className="p-10 text-center text-rose-500">
          Không tìm thấy công việc
        </div>
    );

  return (
      <div className="flex min-h-screen flex-col bg-gray-50 relative selection:bg-blue-100">
        {/* 🟦 SEARCH BAR FIXED – MERGE HEADER */}
        <div
            className={`fixed left-0 w-full
          bg-gradient-to-r from-blue-600/95 via-blue-800/95 to-blue-900/95
          backdrop-blur-lg border-b border-blue-500/20
          shadow-[0_4px_20px_rgba(40,80,200,0.35)]
          py-2 transition-all duration-500 ease-in-out
          ${showSearchBar ? "top-0 z-[55]" : "top-16 z-40"}
        `}
        >
          <div className="mx-auto max-w-6xl px-4">
            <SearchBar size="sm" compact onSearch={handleSearch} />
          </div>
        </div>

        {/* MAIN CONTENT */}
        <main className="mx-auto max-w-6xl px-4 w-full pt-[120px] pb-10 space-y-2">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mt-6">
            {/* LEFT */}
            <div className="md:col-span-8 flex flex-col gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                <JobHeader job={job} isSaved={isSavedFromCard} />
              </div>

              <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 space-y-8">
                <JobDescription description={job.description} />
                <hr className="border-slate-100" />
                <JobRequirements requirements={job.requirements} />
              </div>
            </div>

            {/* RIGHT */}
            <aside className="md:col-span-4">
              <div className="sticky top-[100px] flex flex-col gap-5">
                <JobCompanyInfo company={job.company} job={job} />
                <JobExtraInfo job={job} />
              </div>
            </aside>
          </div>
        </main>
      </div>
  );
};

export default JobDetailPage;
