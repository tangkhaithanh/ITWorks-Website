import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CompanyAPI from "@/features/companies/CompanyAPI";
import TextInput from "@/components/ui/TextInput";
import Button from "@/components/ui/Button";
import { Search, X, Building2, Loader2, MapPin, Users, Briefcase, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom"
const NAV_HEIGHT = 72;

// ============================================================================
// COMPONENT: CompanyLogo - Hiển thị logo công ty với fallback
// ============================================================================
const CompanyLogo = ({ src, name, size = "lg" }) => {
    const [error, setError] = useState(false);

    const sizeClasses = {
        sm: "w-12 h-12",
        md: "w-16 h-16",
        lg: "w-20 h-20",
        xl: "w-24 h-24"
    };

    const initial = useMemo(() => {
        const s = (name || "").trim();
        return s ? s[0].toUpperCase() : "C";
    }, [name]);

    if (!src || error) {
        return (
            <div className={`${sizeClasses[size]} rounded-2xl flex items-center justify-center font-bold text-xl
                      bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 
                      text-blue-600 border-2 border-blue-100 shadow-sm`}>
                {initial}
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={name || "Company"}
            loading="lazy"
            decoding="async"
            onError={() => setError(true)}
            className={`${sizeClasses[size]} rounded-2xl object-cover border-2 border-slate-100 shadow-sm`}
        />
    );
};

// ============================================================================
// COMPONENT: CompanyCard - Card hiển thị thông tin công ty
// ============================================================================
const CompanyCard = ({ company, onClick, index = 0 }) => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Stagger animation based on index
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, index * 50); // Delay 50ms cho mỗi card

        return () => clearTimeout(timer);
    }, [index]);

    return (
        <div
            onClick={() => onClick?.(company)}
            className={`group relative rounded-2xl border border-slate-200 bg-white p-5
                     hover:border-blue-300 hover:shadow-xl hover:-translate-y-1
                     transition-all duration-300 cursor-pointer overflow-hidden
                     ${isVisible
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-8'
            }`}
            style={{
                transition: 'opacity 0.5s ease-out, transform 0.5s ease-out'
            }}
        >
            {/* Gradient overlay khi hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 to-indigo-50/0
                          group-hover:from-blue-50/50 group-hover:to-indigo-50/30
                          transition-all duration-300 rounded-2xl" />

            <div className="relative z-10">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <CompanyLogo src={company.logo_url} name={company.name} size="lg" />
                </div>

                {/* Tên công ty */}
                <h3 className="text-center text-base font-bold text-slate-800 line-clamp-2 min-h-[3rem] mb-3
                             group-hover:text-blue-600 transition-colors">
                    {company.name}
                </h3>

                {/* Thông tin bổ sung */}
                <div className="space-y-2 text-xs text-slate-500">
                    {company.location && (
                        <div className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="line-clamp-1">{company.location}</span>
                        </div>
                    )}

                    {company.employee_count && (
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span>{company.employee_count} nhân viên</span>
                        </div>
                    )}

                    {company.job_count > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Briefcase className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            <span className="text-green-600 font-semibold">
                                {company.job_count} vị trí đang tuyển
                            </span>
                        </div>
                    )}
                </div>

                {/* Badge nổi bật (nếu có) */}
                {company.is_featured && (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-amber-400 to-orange-500
                                  text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg
                                  flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Hot
                    </div>
                )}
            </div>
        </div>
    );
};

// ============================================================================
// COMPONENT: CompanySearchBar - Thanh tìm kiếm
// ============================================================================
const CompanySearchBar = ({ value, onChange, onSubmit, size = "md", loading = false }) => {
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef(null);

    const isLarge = size === "lg";
    const isSmall = size === "sm";

    const containerHeight = isSmall ? "h-[46px]" : isLarge ? "h-[64px]" : "h-[56px]";
    const iconSize = isLarge ? "w-6 h-6" : "w-5 h-5";
    const fontSize = isLarge ? "text-lg" : isSmall ? "text-sm" : "text-base";

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsFocused(false);
        onSubmit?.();
    };

    const handleClear = () => {
        const event = { target: { value: "" } };
        onChange?.(event);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSubmit(e);
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            ref={wrapperRef}
            className={`
                relative z-50 flex items-center gap-2 w-full
                bg-white rounded-full transition-all duration-300 ease-out
                ${isFocused
                ? "ring-4 ring-blue-100 shadow-2xl scale-[1.02]"
                : "shadow-lg hover:shadow-xl"
            }
                ${isSmall ? "p-1.5 pl-4" : "p-2 pl-5"}
            `}
        >
            {/* Input Container */}
            <div className={`relative flex-1 ${containerHeight} flex items-center gap-3`}>
                {/* Icon */}
                <div className={`
                    flex items-center justify-center rounded-full transition-all duration-300
                    ${isLarge ? "w-10 h-10" : "w-9 h-9"}
                    ${isFocused
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-100 text-slate-400"
                }
                `}>
                    {loading ? (
                        <Loader2 className={`${iconSize} animate-spin`} />
                    ) : (
                        <Building2 className={iconSize} />
                    )}
                </div>

                {/* Input Field */}
                <input
                    type="text"
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={isLarge
                        ? "Tìm kiếm công ty theo tên, ngành nghề..."
                        : "Tìm công ty (VD: FPT, Viettel...)"
                    }
                    className={`
                        w-full h-full pr-8
                        bg-transparent border-none outline-none 
                        text-slate-800 font-medium placeholder:text-slate-400
                        ${fontSize}
                    `}
                />

                {/* Clear Button */}
                {value && (
                    <button
                        type="button"
                        onClick={handleClear}
                        className="absolute right-0 p-2 text-slate-400 hover:bg-red-50
                                 hover:text-red-500 rounded-full transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Submit Button */}
            <Button
                type="submit"
                size={isSmall ? "sm" : isLarge ? "lg" : "md"}
                disabled={loading}
                className={`
                    !rounded-full font-bold tracking-wide
                    shadow-lg shadow-blue-500/30 
                    hover:shadow-blue-500/50 hover:scale-105
                    active:scale-95
                    transition-all duration-300
                    bg-gradient-to-r from-blue-600 to-indigo-600 
                    hover:from-blue-700 hover:to-indigo-700
                    text-white
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${isSmall ? 'px-5' : 'px-8'}
                `}
            >
                <span className="flex items-center gap-2">
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Tìm kiếm</span>
                </span>
            </Button>
        </form>
    );
};

// ============================================================================
// COMPONENT: SearchStats - Hiển thị thống kê kết quả tìm kiếm
// ============================================================================
const SearchStats = ({ total, keyword, loading }) => {
    if (loading) return null;

    return (
        <div className="flex items-center gap-2 text-sm text-slate-600 bg-blue-50
                      px-4 py-2.5 rounded-xl border border-blue-100
                      animate-fade-in-up">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>
                Tìm thấy <span className="font-bold text-blue-600">{total}</span> công ty
                {keyword && (
                    <>
                        {" "}cho từ khóa{" "}
                        <span className="font-bold text-slate-800">"{keyword}"</span>
                    </>
                )}
            </span>
        </div>
    );
};

// ============================================================================
// COMPONENT: LoadingSkeleton - Skeleton loading
// ============================================================================
const LoadingSkeleton = ({ count = 8 }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={i}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse"
                    style={{
                        animationDelay: `${i * 50}ms`,
                        animationDuration: '1s'
                    }}
                >
                    <div className="w-20 h-20 rounded-2xl bg-slate-100 mx-auto mb-4" />
                    <div className="h-4 bg-slate-100 rounded w-3/4 mx-auto mb-2" />
                    <div className="h-3 bg-slate-100 rounded w-1/2 mx-auto mb-3" />
                    <div className="space-y-2">
                        <div className="h-3 bg-slate-50 rounded w-full" />
                        <div className="h-3 bg-slate-50 rounded w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    );
};

// ============================================================================
// COMPONENT: EmptyState - Trạng thái không có kết quả
// ============================================================================
const EmptyState = ({ keyword }) => {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200
                          flex items-center justify-center mb-6 animate-bounce-slow">
                <Building2 className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
                Không tìm thấy công ty
            </h3>
            <p className="text-slate-500 text-center max-w-md">
                {keyword ? (
                    <>
                        Không có kết quả nào cho từ khóa <span className="font-semibold">"{keyword}"</span>.
                        <br />Hãy thử tìm kiếm với từ khóa khác.
                    </>
                ) : (
                    "Hiện tại chưa có công ty nào trong hệ thống."
                )}
            </p>
        </div>
    );
};

// ============================================================================
// MAIN COMPONENT: CompanySearchPage
// ============================================================================
const CompanySearchPage = () => {
    const [keyword, setKeyword] = useState("");
    const [companies, setCompanies] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(12);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCompanies, setTotalCompanies] = useState(0);

    const [loading, setLoading] = useState(false);
    const [initLoading, setInitLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const observerRef = useRef(null);
    const lastQueryRef = useRef("");
    const requestIdRef = useRef(0);
    const navigate = useNavigate();
    const hasMore = page < totalPages;

    // Animation on mount
    useEffect(() => {
        setMounted(true);
    }, []);

    // Fetch companies
    const fetchCompanies = useCallback(
        async ({ nextPage = 1, nextKeyword = "", append = false } = {}) => {
            const rid = ++requestIdRef.current;

            try {
                if (!append) setInitLoading(true);
                setLoading(true);

                const kw = (nextKeyword || "").trim();
                const params = {
                    page: nextPage,
                    limit,
                    ...(kw ? { q: kw } : {}),
                };

                const res = await CompanyAPI.search(params);
                if (rid !== requestIdRef.current) return;

                const payload = res?.data?.data;
                const list = Array.isArray(payload?.result) ? payload.result : [];

                setTotalPages(Number(payload?.totalPages || 1));
                setTotalCompanies(Number(payload?.total || 0));
                setPage(Number(payload?.page || nextPage));

                setCompanies((prev) => (append ? [...prev, ...list] : list));
                lastQueryRef.current = kw;
            } catch (err) {
                console.error("Fetch companies error:", err);
                if (!append) {
                    setCompanies([]);
                    setTotalCompanies(0);
                }
            } finally {
                if (rid === requestIdRef.current) {
                    setLoading(false);
                    setInitLoading(false);
                }
            }
        },
        [limit]
    );

    // Load initial data
    useEffect(() => {
        fetchCompanies({ nextPage: 1, nextKeyword: "", append: false });
    }, [fetchCompanies]);

    // Handle search submit
    const handleSubmitSearch = useCallback(() => {
        window.scrollTo({ top: 0, behavior: "smooth" });
        fetchCompanies({ nextPage: 1, nextKeyword: keyword, append: false });
    }, [fetchCompanies, keyword]);

    // Handle company click
    const handleCompanyClick = useCallback((company) => {
        navigate(`/companies/${company.id}`);
    }, [navigate]);

    // Infinite scroll observer
    useEffect(() => {
        const target = observerRef.current;
        if (!target) return;

        const obs = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry.isIntersecting) return;
                if (loading) return;
                if (!hasMore) return;
                if (companies.length === 0) return;

                const nextPage = page + 1;
                fetchCompanies({
                    nextPage,
                    nextKeyword: lastQueryRef.current,
                    append: true,
                });
            },
            {
                root: null,
                rootMargin: "0px 0px 300px 0px",
                threshold: 0,
            }
        );

        obs.observe(target);
        return () => obs.disconnect();
    }, [companies.length, fetchCompanies, hasMore, loading, page]);

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">

            {/* ============================================================
                HERO SECTION - Banner tìm kiếm chính
            ============================================================ */}
            <section className={`relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800
                              pt-24 pb-32 px-4 overflow-hidden
                              transition-all duration-1000 ease-out
                              ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-8'}`}>
                {/* Background decorations */}
                <div className="absolute inset-0 overflow-hidden">
                    <div className={`absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl
                                   transition-all duration-1000 delay-200
                                   ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                    <div className={`absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl
                                   transition-all duration-1000 delay-300
                                   ${mounted ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`} />
                </div>

                <div className="relative max-w-5xl mx-auto text-center">
                    {/* Title */}
                    <div className={`mb-8 transition-all duration-700 delay-100
                                   ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4
                                     tracking-tight leading-tight">
                            Khám phá các công ty hàng đầu
                        </h1>
                        <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto">
                            Tìm kiếm và kết nối với hàng nghìn doanh nghiệp uy tín đang tuyển dụng
                        </p>
                    </div>

                    {/* Search Bar */}
                    <div className={`max-w-3xl mx-auto transition-all duration-700 delay-300
                                   ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <CompanySearchBar
                            value={keyword}
                            onChange={(e) => setKeyword(e.target.value)}
                            onSubmit={handleSubmitSearch}
                            size="lg"
                            loading={loading && !initLoading}
                        />
                    </div>

                    {/* Quick stats */}
                    <div className={`mt-10 flex flex-wrap items-center justify-center gap-8 text-white/90
                                   transition-all duration-700 delay-500
                                   ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                            <Building2 className="w-5 h-5" />
                            <span className="text-sm font-medium">1000+ Công ty</span>
                        </div>
                        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                            <Briefcase className="w-5 h-5" />
                            <span className="text-sm font-medium">5000+ Việc làm</span>
                        </div>
                        <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-300">
                            <Users className="w-5 h-5" />
                            <span className="text-sm font-medium">10000+ Ứng viên</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* ============================================================
                MAIN CONTENT - Danh sách công ty
            ============================================================ */}
            <main className={`max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 -mt-16 pb-16 relative z-10
                            transition-all duration-700 delay-700
                            ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>

                {/* Results container with white background */}
                <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-6 md:p-8">

                    {/* Header with stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">
                                Danh sách công ty
                            </h2>
                            <p className="text-slate-500 text-sm mt-1">
                                Cập nhật liên tục các công ty uy tín
                            </p>
                        </div>

                        {!initLoading && companies.length > 0 && (
                            <SearchStats
                                total={totalCompanies}
                                keyword={lastQueryRef.current}
                                loading={loading}
                            />
                        )}
                    </div>

                    {/* Loading State */}
                    {initLoading && <LoadingSkeleton count={12} />}

                    {/* Empty State */}
                    {!initLoading && companies.length === 0 && (
                        <EmptyState keyword={lastQueryRef.current} />
                    )}

                    {/* Companies Grid */}
                    {!initLoading && companies.length > 0 && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {companies.map((company, index) => (
                                    <CompanyCard
                                        key={company.id}
                                        company={company}
                                        onClick={handleCompanyClick}
                                        index={index}
                                    />
                                ))}
                            </div>

                            {/* Loading more indicator */}
                            {loading && !initLoading && (
                                <div className="flex justify-center items-center py-8 gap-3 animate-fade-in">
                                    <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                                    <span className="text-slate-600 font-medium">
                                        Đang tải thêm công ty...
                                    </span>
                                </div>
                            )}

                            {/* End of results */}
                            {!hasMore && companies.length > 0 && (
                                <div className="text-center py-8 text-slate-500 border-t border-slate-100 mt-8 animate-fade-in">
                                    <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                                    <p className="font-medium">Đã hiển thị tất cả {totalCompanies} công ty</p>
                                </div>
                            )}
                        </>
                    )}

                    {/* Infinite scroll trigger */}
                    <div ref={observerRef} className="h-4" />
                </div>
            </main>

            {/* Bottom spacer */}
            <div style={{ height: NAV_HEIGHT }} />

            {/* CSS Animations */}
            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes fade-in-up {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes bounce-slow {
                    0%, 100% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-10px);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.6s ease-out;
                }

                .animate-fade-in-up {
                    animation: fade-in-up 0.6s ease-out;
                }

                .animate-bounce-slow {
                    animation: bounce-slow 2s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default CompanySearchPage;
