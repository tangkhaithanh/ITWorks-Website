import { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import JobAPI from "@/features/jobs/JobAPI";
import SearchBar from "@/features/jobs/components/SearchBar";
import JobHeader from "@/features/jobs/components/JobHeader";
import JobCompanyInfo from "@/features/jobs/components/JobCompanyInfo";
import JobDescription from "@/features/jobs/components/JobDescription";
import JobRequirements from "@/features/jobs/components/JobRequirements";
import JobExtraInfo from "@/features/jobs/components/JobExtraInfo";

const JobDetailPage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [textboxWidth, setTextboxWidth] = useState(null);
  const [showSearchBar, setShowSearchBar] = useState(false);
  const location = useLocation();

  const isSavedFromCard = location.state?.isSaved ?? false;

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

  // 📏 Đo chiều rộng thực tế của textbox search
  useEffect(() => {
    const measureTextbox = () => {
      const textboxWrapper = document.querySelector('.flex-1.min-w-\\[240px\\]');
      if (textboxWrapper) {
        const width = textboxWrapper.offsetWidth;
        setTextboxWidth(width);
      }
    };
    const timeout = setTimeout(measureTextbox, 100);
    window.addEventListener('resize', measureTextbox);
    return () => {
      window.removeEventListener('resize', measureTextbox);
      clearTimeout(timeout);
    };
  }, []);

  // 🧭 Theo dõi scroll để ẩn header, hiện thanh search
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setShowSearchBar(scrollTop > 80); // khi cuộn xuống chút xíu thì merge
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (loading) return <div className="p-10 text-center text-slate-500">Đang tải...</div>;
  if (!job) return <div className="p-10 text-center text-rose-500">Không tìm thấy công việc</div>;

   return (
  <div className="flex min-h-screen flex-col bg-gray-50 relative">
    {/* 🟦 Thanh search cố định với hiệu ứng dạ quang + animation merge */}
    <div
  className={`fixed left-0 w-full 
              bg-gradient-to-r from-blue-600/95 via-blue-800/95 to-blue-900/95
              backdrop-blur-lg border-b border-blue-500/20
              shadow-[0_4px_20px_rgba(40,80,200,0.35)]
              py-2 transition-all duration-500 ease-in-out
              ${showSearchBar ? "top-0 z-[60]" : "top-16 z-40"}`}
>
  <div className="mx-auto max-w-6xl px-4">
    <SearchBar size="sm" compact />
  </div>
</div>

    {/* ✅ Container chính, có padding-top tránh đè Header + Search */}
    <div className="mx-auto max-w-6xl px-4 w-full space-y-2 pt-[120px]">
      {/* JobHeader + Thông tin công ty */}
      <div className="flex items-start gap-5">
        <div style={{ width: textboxWidth ? `${textboxWidth}px` : "auto" }}>
          <JobHeader job={job} isSaved={isSavedFromCard} />
        </div>

        <div style={{ width: textboxWidth ? `${textboxWidth * 0.55}px` : "auto" }}>
          <JobCompanyInfo company={job.company} job={job} />
        </div>
      </div>

      {/* Mô tả + Yêu cầu + ExtraInfo */}
      <div className="flex gap-5 mt-5">
        <div
          className="flex flex-col gap-8"
          style={{ width: textboxWidth ? `${textboxWidth}px` : "auto" }}
        >
          <JobDescription description={job.description} />
          <JobRequirements requirements={job.requirements} />
        </div>

        <aside style={{ width: textboxWidth ? `${textboxWidth * 0.55}px` : "auto" }}>
          <JobExtraInfo job={job} />
        </aside>
      </div>
    </div>
  </div>
);
};

export default JobDetailPage;
