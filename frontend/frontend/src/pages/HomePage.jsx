// src/features/jobs/pages/HomePage.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "../features/jobs/components/SearchBar";
import { useSelector } from "react-redux";

// Dữ liệu giả lập cho UI (Bạn có thể fetch từ API sau này)
const POPULAR_TAGS = ["ReactJS", "NodeJS", "Java", "Python", "DevOps", "Tester"];
const COMPANIES = ["TechLab", "SoftGlobal", "DevHouse", "InnoSoft", "FutureTech"];
const CATEGORIES = [
  { icon: "💻", title: "Frontend Dev", count: "1.2k+ jobs", color: "bg-blue-100 text-blue-600" },
  { icon: "⚙️", title: "Backend Dev", count: "800+ jobs", color: "bg-indigo-100 text-indigo-600" },
  { icon: "🎨", title: "UI/UX Design", count: "400+ jobs", color: "bg-purple-100 text-purple-600" },
  { icon: "📊", title: "Data Analyst", count: "350+ jobs", color: "bg-emerald-100 text-emerald-600" },
];

const HomePage = () => {
  const navigate = useNavigate();
  // Giữ nguyên logic Redux của bạn
  const { keyword, city } = useSelector((s) => s.jobSearch);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (keyword) params.set("keyword", keyword);
    if (city) params.set("city", city);
    navigate(`/jobs/search?${params.toString()}`);
  };

  const handleTagClick = (tag) => {
    const params = new URLSearchParams();
    params.set("keyword", tag);
    navigate(`/jobs/search?${params.toString()}`);
  };

  return (
    <main className="min-h-screen bg-white relative overflow-x-hidden font-sans text-slate-900">
      {/* --- BACKGROUND ELEMENTS --- */}
      {/* Grid Pattern tạo cảm giác kỹ thuật */}
      <div className="absolute inset-0 h-full w-full bg-white bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
      
      {/* Gradient Blobs tinh tế hơn */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-blue-50/80 to-transparent pointer-events-none"></div>
      <div className="absolute -top-24 right-0 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl mix-blend-multiply animate-pulse"></div>
      <div className="absolute top-20 -left-20 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl mix-blend-multiply animate-pulse delay-1000"></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        
        {/* 1. HERO SECTION */}
        <div className="text-center max-w-4xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-blue-100 shadow-sm mb-8 animate-fade-in-up">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-600">Nền tảng tuyển dụng IT #1 Việt Nam</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-[1.1]">
            Khởi đầu sự nghiệp <br className="hidden md:block" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600">
              Công nghệ đỉnh cao
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Kết nối với 500+ công ty công nghệ hàng đầu. Tìm kiếm cơ hội việc làm phù hợp với kỹ năng và đam mê của bạn ngay hôm nay.
          </p>

          {/* 2. SEARCH SECTION (Nổi bật) */}
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-white/50 ring-1 ring-slate-100">
              <SearchBar onSearch={handleSearch} size="lg" />
            </div>
            
            {/* UX: Trending Tags */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-slate-500">
              <span>🔥 Phổ biến:</span>
              {POPULAR_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-full hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors duration-200 shadow-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. SOCIAL PROOF (Tin cậy) */}
        <div className="border-y border-slate-100 py-10 mb-20 bg-slate-50/50">
          <p className="text-center text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">
            Được tin tưởng bởi các công ty hàng đầu
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
             {/* Thay thế bằng Logo hình ảnh thật sẽ đẹp hơn */}
             {COMPANIES.map((company, idx) => (
               <span key={idx} className="text-xl md:text-2xl font-bold text-slate-400 hover:text-blue-600 cursor-default transition-colors">
                 {company}
               </span>
             ))}
          </div>
        </div>

        {/* 4. FEATURED CATEGORIES (Khám phá) */}
        <div className="mb-20">
          <div className="flex justify-between items-end mb-8 px-2">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 mb-2">Khám phá cơ hội</h2>
              <p className="text-slate-500">Các lĩnh vực đang được tuyển dụng nhiều nhất</p>
            </div>
            <button className="hidden md:block text-blue-600 font-semibold hover:text-blue-700 hover:underline">
              Xem tất cả &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat, idx) => (
              <div 
                key={idx}
                className="group p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-lg ${cat.color} flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>
                  {cat.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-800 mb-1">{cat.title}</h3>
                <p className="text-sm text-slate-500">{cat.count}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 5. STATS (Minimalist) */}
        <div className="bg-blue-600 rounded-3xl p-8 md:p-16 text-white text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 divide-y md:divide-y-0 md:divide-x divide-blue-500/50">
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">5000+</div>
                <div className="text-blue-200">Việc làm mới</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">200+</div>
                <div className="text-blue-200">Công ty mới tham gia</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold mb-2">15k+</div>
                <div className="text-blue-200">CV đã ứng tuyển</div>
              </div>
           </div>
        </div>

      </div>
    </main>
  );
};

export default HomePage;