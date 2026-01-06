// src/features/jobs/pages/HomePage.jsx
import { useNavigate } from "react-router-dom";
import SearchBar from "../features/jobs/components/SearchBar";
import { useSelector } from "react-redux";
import { useState, useEffect, useRef } from "react";
import {
  FaBuilding, FaUsers, FaBriefcase, FaStar, FaChartLine,
  FaShieldAlt, FaClock, FaCheckCircle, FaArrowRight,
  FaMapMarkerAlt, FaDollarSign, FaLaptopCode, FaRocket
} from "react-icons/fa";

// Dữ liệu mẫu (giữ nguyên như cũ)
const POPULAR_TAGS = [
  "ReactJS", "NodeJS", "Java", "Python", "DevOps",
  "Tester", "AWS", "Docker", "Kubernetes", "TypeScript"
];

const COMPANIES = [
  { name: "TechLab", logo: "🚀", jobs: 45, verified: true },
  { name: "SoftGlobal", logo: "🌐", jobs: 32, verified: true },
  { name: "DevHouse", logo: "💎", jobs: 28, verified: true },
  { name: "InnoSoft", logo: "⚡", jobs: 51, verified: true },
  { name: "FutureTech", logo: "🔮", jobs: 39, verified: true },
  { name: "CloudBase", logo: "☁️", jobs: 42, verified: true },
];

const CATEGORIES = [
  {
    icon: "💻",
    title: "Frontend Developer",
    count: "1,234",
    color: "from-blue-500/90 to-cyan-500/90",
    bgColor: "bg-blue-50/80",
    iconBg: "bg-blue-100",
    description: "React, Vue, Angular",
    salary: "$1,500 - $3,000",
    growth: "+12%"
  },
  {
    icon: "⚙️",
    title: "Backend Developer",
    count: "856",
    color: "from-slate-600/90 to-slate-700/90",
    bgColor: "bg-slate-50/80",
    iconBg: "bg-slate-100",
    description: "Node.js, Java, Python",
    salary: "$1,800 - $3,500",
    growth: "+15%"
  },
  {
    icon: "📱",
    title: "Mobile Developer",
    count: "432",
    color: "from-emerald-500/90 to-teal-500/90",
    bgColor: "bg-emerald-50/80",
    iconBg: "bg-emerald-100",
    description: "iOS, Android, Flutter",
    salary: "$1,600 - $3,200",
    growth: "+18%"
  },
  {
    icon: "🎨",
    title: "UI/UX Designer",
    count: "389",
    color: "from-violet-500/90 to-purple-500/90",
    bgColor: "bg-violet-50/80",
    iconBg: "bg-violet-100",
    description: "Figma, Sketch, Adobe XD",
    salary: "$1,200 - $2,500",
    growth: "+10%"
  },
  {
    icon: "📊",
    title: "Data Analyst",
    count: "567",
    color: "from-amber-500/90 to-orange-500/90",
    bgColor: "bg-amber-50/80",
    iconBg: "bg-amber-100",
    description: "SQL, Python, Tableau",
    salary: "$1,400 - $2,800",
    growth: "+20%"
  },
  {
    icon: "🔒",
    title: "DevOps Engineer",
    count: "298",
    color: "from-red-500/90 to-rose-500/90",
    bgColor: "bg-red-50/80",
    iconBg: "bg-red-100",
    description: "AWS, Docker, K8s",
    salary: "$2,000 - $4,000",
    growth: "+22%"
  },
  {
    icon: "🤖",
    title: "AI/ML Engineer",
    count: "234",
    color: "from-indigo-500/90 to-blue-500/90",
    bgColor: "bg-indigo-50/80",
    iconBg: "bg-indigo-100",
    description: "TensorFlow, PyTorch",
    salary: "$2,500 - $5,000",
    growth: "+25%"
  },
  {
    icon: "🧪",
    title: "QA/Tester",
    count: "445",
    color: "from-cyan-500/90 to-sky-500/90",
    bgColor: "bg-cyan-50/80",
    iconBg: "bg-cyan-100",
    description: "Automation, Manual",
    salary: "$1,000 - $2,200",
    growth: "+8%"
  },
];

const FEATURES = [
  {
    icon: FaChartLine,
    title: "AI Matching thông minh",
    description: "Thuật toán AI phân tích kỹ năng và gợi ý công việc phù hợp nhất với profile của bạn",
    color: "from-blue-500 to-cyan-500",
    stats: "95% độ chính xác"
  },
  {
    icon: FaClock,
    title: "Ứng tuyển 1-Click",
    description: "Hệ thống CV builder tích hợp, ứng tuyển nhanh chóng chỉ với một cú click chuột",
    color: "from-emerald-500 to-teal-500",
    stats: "Tiết kiệm 80% thời gian"
  },
  {
    icon: FaShieldAlt,
    title: "Bảo mật tuyệt đối",
    description: "Thông tin cá nhân được mã hóa SSL 256-bit, tuân thủ chuẩn GDPR quốc tế",
    color: "from-violet-500 to-purple-500",
    stats: "100% an toàn"
  },
  {
    icon: FaCheckCircle,
    title: "Xác thực doanh nghiệp",
    description: "Tất cả công ty đều được xác minh giấy phép kinh doanh và uy tín trước khi đăng tin",
    color: "from-amber-500 to-orange-500",
    stats: "500+ công ty uy tín"
  },
];

const RECENT_JOBS = [
  {
    id: 1,
    title: "Senior Frontend Developer",
    company: "TechLab",
    logo: "🚀",
    salary: "$1,500 - $2,500",
    location: "Hà Nội",
    type: "Full-time",
    level: "Senior",
    tags: ["ReactJS", "TypeScript", "TailwindCSS"],
    isHot: true,
    isUrgent: false,
    postedTime: "2 giờ trước",
    applicants: 15,
    verified: true
  },
  {
    id: 2,
    title: "Backend Engineer (NodeJS)",
    company: "SoftGlobal",
    logo: "🌐",
    salary: "$1,800 - $3,000",
    location: "TP.HCM",
    type: "Full-time",
    level: "Middle",
    tags: ["NodeJS", "MongoDB", "AWS"],
    isHot: true,
    isUrgent: true,
    postedTime: "1 ngày trước",
    applicants: 23,
    verified: true
  },
  {
    id: 3,
    title: "UI/UX Designer",
    company: "DevHouse",
    logo: "💎",
    salary: "$1,000 - $1,800",
    location: "Remote",
    type: "Part-time",
    level: "Junior",
    tags: ["Figma", "UI Design", "Prototyping"],
    isHot: false,
    isUrgent: false,
    postedTime: "3 ngày trước",
    applicants: 8,
    verified: true
  },
  {
    id: 4,
    title: "DevOps Engineer",
    company: "CloudBase",
    logo: "☁️",
    salary: "$2,000 - $3,500",
    location: "Đà Nẵng",
    type: "Full-time",
    level: "Senior",
    tags: ["AWS", "Docker", "Kubernetes"],
    isHot: true,
    isUrgent: true,
    postedTime: "5 giờ trước",
    applicants: 12,
    verified: true
  },
  {
    id: 5,
    title: "Full Stack Developer",
    company: "InnoSoft",
    logo: "⚡",
    salary: "$1,600 - $2,800",
    location: "Hà Nội",
    type: "Full-time",
    level: "Middle",
    tags: ["React", "Node.js", "PostgreSQL"],
    isHot: false,
    isUrgent: false,
    postedTime: "1 ngày trước",
    applicants: 19,
    verified: true
  },
  {
    id: 6,
    title: "Data Scientist",
    company: "FutureTech",
    logo: "🔮",
    salary: "$2,200 - $4,000",
    location: "TP.HCM",
    type: "Full-time",
    level: "Senior",
    tags: ["Python", "Machine Learning", "TensorFlow"],
    isHot: true,
    isUrgent: false,
    postedTime: "4 giờ trước",
    applicants: 7,
    verified: true
  },
];

const TESTIMONIALS = [
  {
    name: "Nguyễn Văn A",
    role: "Senior Developer",
    company: "TechCorp",
    avatar: "👨‍💻",
    content: "Tôi đã tìm được công việc mơ ước chỉ sau 2 tuần sử dụng JobFinder. Hệ thống gợi ý rất chính xác!",
    rating: 5
  },
  {
    name: "Trần Thị B",
    role: "UX Designer",
    company: "DesignHub",
    avatar: "👩‍🎨",
    content: "Giao diện thân thiện, dễ sử dụng. Đặc biệt là tính năng CV builder giúp tôi tiết kiệm rất nhiều thời gian.",
    rating: 5
  },
  {
    name: "Lê Minh C",
    role: "DevOps Engineer",
    company: "CloudTech",
    avatar: "👨‍💼",
    content: "Nền tảng tuyển dụng IT tốt nhất tôi từng dùng. Nhiều cơ hội việc làm chất lượng từ các công ty uy tín.",
    rating: 5
  },
];

const STATS_ENTERPRISE = [
  {
    icon: FaBriefcase,
    number: "5,000+",
    label: "Việc làm mới mỗi tháng",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: FaBuilding,
    number: "500+",
    label: "Công ty đối tác",
    color: "from-emerald-500 to-teal-500"
  },
  {
    icon: FaUsers,
    number: "15,000+",
    label: "Ứng viên thành công",
    color: "from-violet-500 to-purple-500"
  },
  {
    icon: FaStar,
    number: "4.9/5",
    label: "Đánh giá từ người dùng",
    color: "from-amber-500 to-orange-500"
  },
];

const HomePage = () => {
  const navigate = useNavigate();
  const { keyword, city } = useSelector((s) => s.jobSearch);
  const [activeTab, setActiveTab] = useState("all");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Refs for scroll animations
  const companiesRef = useRef(null);
  const categoriesRef = useRef(null);
  const jobsRef = useRef(null);
  const featuresRef = useRef(null);
  const testimonialsRef = useRef(null);

  // State for visibility
  const [visibleSections, setVisibleSections] = useState({
    companies: false,
    categories: false,
    jobs: false,
    features: false,
    testimonials: false,
  });

  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const sectionName = entry.target.getAttribute('data-section');
          setVisibleSections(prev => ({
            ...prev,
            [sectionName]: true
          }));
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all sections
    const sections = [
      { ref: companiesRef, name: 'companies' },
      { ref: categoriesRef, name: 'categories' },
      { ref: jobsRef, name: 'jobs' },
      { ref: featuresRef, name: 'features' },
      { ref: testimonialsRef, name: 'testimonials' },
    ];

    sections.forEach(({ ref }) => {
      if (ref.current) {
        observer.observe(ref.current);
      }
    });

    return () => {
      sections.forEach(({ ref }) => {
        if (ref.current) {
          observer.unobserve(ref.current);
        }
      });
    };
  }, []);

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

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

  const handleCategoryClick = (category) => {
    const params = new URLSearchParams();
    params.set("keyword", category.title);
    navigate(`/jobs/search?${params.toString()}`);
  };

  const handleJobClick = (jobId) => {
    navigate(`/jobs/${jobId}`);
  };

  return (
      <main className="min-h-screen bg-white overflow-hidden">

        {/* ========== HERO SECTION ========== */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50/30 to-white">
          {/* Animated Background Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#8882_1px,transparent_1px),linear-gradient(to_bottom,#8882_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)] animate-grid-flow"></div>

          {/* Floating Elements with Parallax */}
          <div
              className="absolute top-20 right-20 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-float"
              style={{ transform: `translate(${mousePosition.x}px, ${mousePosition.y}px)` }}
          ></div>
          <div
              className="absolute bottom-20 left-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl animate-float-delayed"
              style={{ transform: `translate(${-mousePosition.x}px, ${-mousePosition.y}px)` }}
          ></div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">

            {/* Trust Badges */}
            <div className="flex justify-center mb-8 animate-bounce-in">
              <div className="inline-flex items-center gap-6 px-6 py-3 rounded-full bg-white border border-slate-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm font-medium text-slate-700">5,000+ việc làm mới</span>
                </div>
                <div className="h-4 w-px bg-slate-300"></div>
                <div className="flex items-center gap-2">
                  <FaShieldAlt className="text-blue-600" />
                  <span className="text-sm font-medium text-slate-700">100% xác thực</span>
                </div>
              </div>
            </div>

            {/* Main Heading */}
            <div className="text-center max-w-5xl mx-auto mb-12">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight animate-slide-up">
                Nền tảng tuyển dụng IT
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  hàng đầu Việt Nam
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-slate-600 mb-10 leading-relaxed animate-slide-up animation-delay-200 max-w-3xl mx-auto">
                Kết nối với <span className="font-semibold text-slate-900">500+ công ty công nghệ uy tín</span>,
                khám phá hàng nghìn cơ hội việc làm phù hợp với kỹ năng của bạn
              </p>

              {/* Search Bar */}
              <div className="max-w-4xl mx-auto animate-scale-in animation-delay-400">
                <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-3 hover:shadow-2xl transition-shadow">
                  <SearchBar onSearch={handleSearch} size="lg" />
                </div>

                {/* Popular Tags */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-slate-500 text-sm font-medium animate-fade-in flex items-center gap-1">
                    <FaRocket className="text-blue-500" />
                    Xu hướng:
                  </span>
                  {POPULAR_TAGS.map((tag, idx) => (
                      <button
                          key={tag}
                          onClick={() => handleTagClick(tag)}
                          className="px-4 py-2 bg-white border border-slate-200 rounded-full text-slate-700 text-sm font-medium hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-110 animate-fade-in shadow-sm hover:shadow"
                          style={{ animationDelay: `${0.6 + idx * 0.05}s` }}
                      >
                        {tag}
                      </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Enterprise Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto mt-20">
              {STATS_ENTERPRISE.map((stat, idx) => (
                  <div
                      key={idx}
                      className="text-center p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 animate-slide-up"
                      style={{ animationDelay: `${1 + idx * 0.1}s` }}
                  >
                    <div className={`w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg`}>
                      <stat.icon className="text-2xl" />
                    </div>
                    <div className="text-3xl font-bold text-slate-900 mb-2">{stat.number}</div>
                    <div className="text-slate-600 text-sm leading-tight">{stat.label}</div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== TRUSTED COMPANIES ========== */}
        <section
            ref={companiesRef}
            data-section="companies"
            className={`py-20 bg-white border-y border-slate-100 transition-all duration-1000 ${
                visibleSections.companies ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                Được tin tưởng bởi các công ty hàng đầu
              </h2>
              <p className="text-slate-600 text-lg">
                Hơn 500 doanh nghiệp công nghệ đã chọn JobFinder làm đối tác tuyển dụng
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {COMPANIES.map((company, idx) => (
                  <div
                      key={idx}
                      className={`group relative bg-slate-50 rounded-2xl p-6 border border-slate-200 hover:border-blue-200 hover:shadow-lg transition-all cursor-pointer ${
                          visibleSections.companies ? 'animate-scale-in' : 'opacity-0'
                      }`}
                      style={{ animationDelay: visibleSections.companies ? `${idx * 0.1}s` : '0s' }}
                  >
                    {company.verified && (
                        <div className="absolute top-2 right-2">
                          <FaCheckCircle className="text-blue-500 text-sm" />
                        </div>
                    )}
                    <div className="text-center">
                      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                        {company.logo}
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1 group-hover:text-blue-600 transition-colors">
                        {company.name}
                      </h3>
                      <p className="text-xs text-slate-500">{company.jobs} việc làm</p>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== JOB CATEGORIES ========== */}
        <section
            ref={categoriesRef}
            data-section="categories"
            className={`py-20 bg-slate-50/50 transition-all duration-1000 ${
                visibleSections.categories ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Khám phá theo ngành nghề
              </h2>
              <p className="text-lg text-slate-600">
                Tìm kiếm công việc phù hợp với chuyên môn và đam mê của bạn.
                Mức lương cạnh tranh, cơ hội phát triển không giới hạn.
              </p>
            </div>

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {CATEGORIES.map((cat, idx) => (
                  <div
                      key={idx}
                      onClick={() => handleCategoryClick(cat)}
                      className={`group relative bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden ${
                          visibleSections.categories ? 'animate-scale-in' : 'opacity-0'
                      }`}
                      style={{ animationDelay: visibleSections.categories ? `${idx * 0.05}s` : '0s' }}
                  >
                    {/* Gradient Background on Hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>

                    {/* Growth Badge */}
                    <div className="absolute top-4 right-4 px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200 group-hover:bg-white/90 group-hover:text-emerald-700 transition-colors">
                      {cat.growth}
                    </div>

                    {/* Content */}
                    <div className="relative z-10">
                      <div className={`w-14 h-14 ${cat.iconBg} rounded-xl flex items-center justify-center text-3xl mb-4 group-hover:bg-white/90 transition-all group-hover:rotate-6 group-hover:scale-110`}>
                        {cat.icon}
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-white transition-colors">
                        {cat.title}
                      </h3>
                      <p className="text-sm text-slate-600 mb-3 group-hover:text-white/90 transition-colors">
                        {cat.description}
                      </p>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-500 group-hover:text-white/80 transition-colors flex items-center gap-1">
                            <FaDollarSign className="text-xs" />
                            Mức lương:
                          </span>
                          <span className="font-semibold text-slate-900 group-hover:text-white transition-colors">
                            {cat.salary}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 group-hover:border-white/20">
                        <span className="text-2xl font-bold text-blue-600 group-hover:text-white transition-colors">
                          {cat.count}
                        </span>
                        <span className="text-sm text-slate-500 group-hover:text-white/90 transition-colors">
                          việc làm
                        </span>
                      </div>
                    </div>

                    {/* Arrow Icon */}
                    <div className="absolute bottom-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300 group-hover:bg-white/90">
                      <FaArrowRight className="text-slate-700 text-sm" />
                    </div>
                  </div>
              ))}
            </div>

            {/* View All Button */}
            <div className="text-center">
              <button
                  onClick={() => navigate('/jobs/search')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
              >
                Xem tất cả ngành nghề
                <FaArrowRight />
              </button>
            </div>
          </div>
        </section>

        {/* ========== FEATURED JOBS ========== */}
        <section
            ref={jobsRef}
            data-section="jobs"
            className={`py-20 bg-white transition-all duration-1000 ${
                visibleSections.jobs ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Header with Tabs */}
            <div className="mb-12">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <h2 className="text-4xl font-bold text-slate-900 mb-2">
                    Việc làm nổi bật
                  </h2>
                  <p className="text-lg text-slate-600">
                    Cơ hội mới nhất từ các công ty hàng đầu, cập nhật liên tục
                  </p>
                </div>
                <button
                    onClick={() => navigate('/jobs/search')}
                    className="hidden md:flex items-center gap-2 text-blue-600 font-semibold hover:gap-3 transition-all"
                >
                  Xem tất cả
                  <FaArrowRight />
                </button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-3 overflow-x-auto pb-2">
                {[
                  { id: "all", label: "Tất cả", count: RECENT_JOBS.length },
                  { id: "hot", label: "🔥 Hot", count: RECENT_JOBS.filter(j => j.isHot).length },
                  { id: "urgent", label: "⚡ Gấp", count: RECENT_JOBS.filter(j => j.isUrgent).length },
                  { id: "remote", label: "🏠 Remote", count: RECENT_JOBS.filter(j => j.location === "Remote").length },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
                            activeTab === tab.id
                                ? "bg-blue-600 text-white shadow-lg"
                                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                ))}
              </div>
            </div>

            {/* Jobs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {RECENT_JOBS.map((job, idx) => (
                  <div
                      key={job.id}
                      onClick={() => handleJobClick(job.id)}
                      className={`group bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-2xl hover:border-blue-200 transition-all duration-300 cursor-pointer ${
                          visibleSections.jobs ? 'animate-slide-up' : 'opacity-0'
                      }`}
                      style={{ animationDelay: visibleSections.jobs ? `${idx * 0.1}s` : '0s' }}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl flex items-center justify-center text-2xl border border-slate-200 group-hover:scale-110 transition-transform shadow-sm">
                          {job.logo}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-slate-900 text-sm">{job.company}</h3>
                            {job.verified && (
                                <FaCheckCircle className="text-blue-500 text-xs" />
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <FaMapMarkerAlt className="text-[10px]" />
                            {job.location}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        {job.isHot && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full border border-orange-200 animate-pulse-glow">
                              🔥 HOT
                            </span>
                        )}
                        {job.isUrgent && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded-full border border-red-200">
                              ⚡ GẤP
                            </span>
                        )}
                      </div>
                    </div>

                    {/* Job Title */}
                    <h3 className="text-lg font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2 min-h-[3.5rem]">
                      {job.title}
                    </h3>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.tags.slice(0, 3).map((tag, tagIdx) => (
                          <span
                              key={tagIdx}
                              className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                          >
                            {tag}
                          </span>
                      ))}
                      {job.tags.length > 3 && (
                          <span className="px-3 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded-full border border-slate-200">
                          +{job.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 mb-4 pb-4 border-b border-slate-100">
                      <span className="flex items-center gap-1">
                        <FaClock className="text-[10px]" />
                        {job.postedTime}
                      </span>
                      <span className="flex items-center gap-1">
                        <FaUsers className="text-[10px]" />
                        {job.applicants} ứng viên
                      </span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                        {job.level}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold text-blue-600 flex items-center gap-1">
                          <FaDollarSign className="text-sm" />
                          {job.salary}
                        </div>
                        <div className="text-xs text-slate-500">{job.type}</div>
                      </div>
                      <button className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 transition-all hover:scale-105 hover:shadow-lg flex items-center gap-2 text-sm">
                        Ứng tuyển
                        <FaArrowRight className="text-xs" />
                      </button>
                    </div>
                  </div>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <button
                  onClick={() => navigate('/jobs/search')}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-900 text-slate-900 font-semibold rounded-xl hover:bg-slate-900 hover:text-white transition-all duration-200"
              >
                Xem thêm việc làm
                <FaArrowRight />
              </button>
            </div>
          </div>
        </section>

        {/* ========== FEATURES ========== */}
        <section
            ref={featuresRef}
            data-section="features"
            className={`py-20 bg-slate-50 transition-all duration-1000 ${
                visibleSections.features ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Tại sao chọn JobFinder?
              </h2>
              <p className="text-lg text-slate-600">
                Nền tảng tuyển dụng IT được tin dùng nhất Việt Nam với công nghệ AI tiên tiến
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {FEATURES.map((feature, idx) => (
                  <div
                      key={idx}
                      className={`group relative bg-white rounded-2xl p-8 border border-slate-200 hover:border-slate-300 hover:shadow-xl transition-all duration-300 ${
                          visibleSections.features ? 'animate-scale-in' : 'opacity-0'
                      }`}
                      style={{ animationDelay: visibleSections.features ? `${idx * 0.1}s` : '0s' }}
                  >
                    {/* Icon with gradient */}
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white text-2xl mx-auto mb-6 transform group-hover:scale-110 group-hover:rotate-6 transition-all shadow-lg`}>
                      <feature.icon />
                    </div>

                    <h3 className="text-xl font-bold text-slate-900 mb-3 text-center">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 leading-relaxed text-center mb-4">
                      {feature.description}
                    </p>

                    {/* Stats Badge */}
                    <div className="text-center">
                      <span className="inline-block px-4 py-2 bg-slate-100 text-slate-700 text-sm font-semibold rounded-full">
                        {feature.stats}
                      </span>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section
            ref={testimonialsRef}
            data-section="testimonials"
            className={`py-20 bg-white transition-all duration-1000 ${
                visibleSections.testimonials ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Câu chuyện thành công
              </h2>
              <p className="text-lg text-slate-600">
                Hàng nghìn ứng viên đã tìm được công việc mơ ước qua JobFinder
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((testimonial, idx) => (
                  <div
                      key={idx}
                      className={`bg-slate-50 rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-all ${
                          visibleSections.testimonials ? 'animate-slide-up' : 'opacity-0'
                      }`}
                      style={{ animationDelay: visibleSections.testimonials ? `${idx * 0.15}s` : '0s' }}
                  >
                    <div className="flex items-center gap-4 mb-4">
                      <div className="text-4xl">{testimonial.avatar}</div>
                      <div>
                        <h4 className="font-bold text-slate-900">{testimonial.name}</h4>
                        <p className="text-sm text-slate-600">{testimonial.role}</p>
                        <p className="text-xs text-slate-500">{testimonial.company}</p>
                      </div>
                    </div>

                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                          <FaStar key={i} className="text-amber-400" />
                      ))}
                    </div>

                    <p className="text-slate-600 leading-relaxed italic">
                      "{testimonial.content}"
                    </p>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== CTA SECTION ========== */}
        <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
          {/* Animated Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] animate-grid-flow"></div>
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl animate-float-delayed"></div>

          <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-6">
              <FaLaptopCode />
              Bắt đầu hành trình sự nghiệp của bạn
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Sẵn sàng tìm kiếm cơ hội mới?
            </h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Tham gia cùng <span className="font-semibold text-white">15,000+ ứng viên</span> đã tìm được
              công việc mơ ước qua nền tảng của chúng tôi
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <button
                  onClick={() => navigate('/jobs/search')}
                  className="px-8 py-4 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaBriefcase />
                Tìm việc ngay
              </button>
              <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-4 bg-transparent border-2 border-white/30 text-white font-bold rounded-xl hover:bg-white/10 hover:border-white/50 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <FaUsers />
                Đăng ký miễn phí
              </button>
            </div>

            {/* Final Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { number: "5K+", label: "Việc làm mới/tuần" },
                { number: "500+", label: "Công ty đối tác" },
                { number: "15K+", label: "CV được gửi/tháng" },
              ].map((stat, idx) => (
                  <div key={idx} className="text-center">
                    <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                    <div className="text-slate-400 text-sm">{stat.label}</div>
                  </div>
              ))}
            </div>
          </div>
        </section>

        {/* Custom Animations */}
        <style jsx>{`
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }

          @keyframes slide-up {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes scale-in {
            from {
              opacity: 0;
              transform: scale(0.9);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes bounce-in {
            0% {
              opacity: 0;
              transform: scale(0.3);
            }
            50% {
              transform: scale(1.05);
            }
            70% {
              transform: scale(0.9);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }

          @keyframes float-delayed {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(20px);
            }
          }

          @keyframes pulse-glow {
            0%, 100% {
              box-shadow: 0 0 0 0 rgba(251, 146, 60, 0.4);
            }
            50% {
              box-shadow: 0 0 20px 5px rgba(251, 146, 60, 0.2);
            }
          }

          @keyframes grid-flow {
            0% {
              transform: translateY(0);
            }
            100% {
              transform: translateY(4rem);
            }
          }

          .animate-fade-in {
            animation: fade-in 0.6s ease-out forwards;
            opacity: 0;
          }

          .animate-slide-up {
            animation: slide-up 0.8s ease-out forwards;
            opacity: 0;
          }

          .animate-scale-in {
            animation: scale-in 0.6s ease-out forwards;
            opacity: 0;
          }

          .animate-bounce-in {
            animation: bounce-in 0.8s ease-out forwards;
            opacity: 0;
          }

          .animate-float {
            animation: float 6s ease-in-out infinite;
          }

          .animate-float-delayed {
            animation: float-delayed 8s ease-in-out infinite;
          }

          .animate-pulse-glow {
            animation: pulse-glow 2s ease-in-out infinite;
          }

          .animate-grid-flow {
            animation: grid-flow 20s linear infinite;
          }

          .animation-delay-200 {
            animation-delay: 0.2s;
          }

          .animation-delay-400 {
            animation-delay: 0.4s;
          }

          .line-clamp-2 {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
          }
        `}</style>
      </main>
  );
};

export default HomePage;
