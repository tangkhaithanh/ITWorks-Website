import { useState } from "react";
import { useSelector } from "react-redux";

// --- HELPERS ---
const formatVnd = (value) => {
    if (value === null || value === undefined) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(Number(value)) + " ₫";
};

// --- ICONS ---
const Icons = {
    Job: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
    ),
    Credit: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
    ),
    More: () => (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
    ),
    Edit: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
    ),
    EyeOff: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    ),
    Eye: () => (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    )
};

export default function PlanCard({
    plan,
    openMenuId,
    setOpenMenuId,
    onEdit,
    onHide,
    onUnhide,
    onChoosePlan,
    chooseLabel,
    chooseDisabled,
    chooseHint,
}) {
    const { user } = useSelector((state) => state.auth);

    // Check Role
    const isAdmin = user?.role === 'admin';
    const isRecruiter = user?.role === 'recruiter';

    const isHidden = !!plan?.is_hidden;
    const recruiterBtnDisabled = !!plan?.is_hidden || !!chooseDisabled;
    const recruiterBtnLabel = plan?.is_hidden
        ? "Gói tạm ngưng"
        : (chooseLabel || "Choose Plan");

    return (
        <div
            className={`
                group relative flex flex-col h-full bg-white rounded-3xl transition-all duration-300
                ${isHidden
                    ? "border-2 border-dashed border-slate-300 opacity-75 grayscale-[0.8]"
                    : "border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 hover:border-blue-200"
                }
            `}
        >
            {/* --- TOP BADGES & ACTIONS --- */}
            <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                {isAdmin && isHidden && (
                    <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-500 rounded-full border border-slate-200">
                        Hidden
                    </span>
                )}

                {/* MENU - CHỈ HIỆN VỚI ADMIN */}
                {isAdmin && (
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === plan.id ? null : plan.id);
                            }}
                            className={`p-1.5 rounded-full transition-colors ${openMenuId === plan.id
                                ? "bg-blue-50 text-blue-600"
                                : "text-slate-300 hover:text-slate-600 hover:bg-slate-100"
                                }`}
                        >
                            <Icons.More />
                        </button>

                        {/* Dropdown Menu */}
                        {openMenuId === plan.id && (
                            <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-xl shadow-slate-200/50 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                <button
                                    onClick={() => onEdit(plan.id)}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors text-left"
                                >
                                    <Icons.Edit /> Chỉnh sửa
                                </button>
                                {isHidden ? (
                                    <button
                                        onClick={() => onUnhide(plan.id)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 transition-colors text-left"
                                    >
                                        <Icons.Eye /> Hiển thị
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onHide(plan.id)}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                                    >
                                        <Icons.EyeOff /> Ẩn gói
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* --- DECORATION --- */}
            <div className={`h-1.5 w-1/3 rounded-full mx-6 mt-6 mb-4 ${isHidden ? 'bg-slate-300' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`} />

            {/* --- HEADER --- */}
            <div className="px-6">
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                    {plan?.name || "Tên gói"}
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                    ID: {plan?.id}
                </p>
            </div>

            {/* --- PRICE --- */}
            <div className="px-6 py-5">
                <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-extrabold tracking-tight ${isHidden ? 'text-slate-400' : 'text-slate-900'}`}>
                        {formatVnd(plan?.price).replace(" ₫", "")}
                    </span>
                    <span className="text-base font-semibold text-slate-500">₫</span>
                    <span className="text-sm text-slate-400 font-medium">
                        / {plan?.duration_days} ngày
                    </span>
                </div>
            </div>

            {/* --- METRICS --- */}
            <div className="px-6 pb-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center items-center text-center group-hover:border-blue-100 transition-colors">
                        <div className="text-blue-500 mb-1.5"><Icons.Job /></div>
                        <span className="text-lg font-bold text-slate-700 leading-none">
                            {plan?.job_limit}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">Jobs</span>
                    </div>

                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center items-center text-center group-hover:border-blue-100 transition-colors">
                        <div className="text-amber-500 mb-1.5"><Icons.Credit /></div>
                        <span className="text-lg font-bold text-slate-700 leading-none">
                            {plan?.credit_amount}
                        </span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">Credits</span>
                    </div>
                </div>
            </div>

            {/* --- DIVIDER --- */}
            <div className="border-t border-slate-100 w-full" />

            {/* --- FEATURES (FULL CONTENT - KHÔNG SCROLL) --- */}
            <div className="flex-1 p-6">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                    Quyền lợi đi kèm
                </p>
                {/* Đã xóa h-32 và overflow-hidden */}
                <div
                    className="text-sm text-slate-600 leading-relaxed prose prose-sm prose-ul:pl-0 prose-li:flex prose-li:items-start prose-li:gap-2 prose-p:my-1 prose-ul:my-0"
                    dangerouslySetInnerHTML={{ __html: plan?.features || "<em>Chưa có mô tả</em>" }}
                />
            </div>

            {/* BUTTON - CHỈ HIỆN VỚI RECRUITER */}
            {isRecruiter && (
                <div className="px-6 pb-6 mt-auto">
                    <button
                        onClick={() => {
                            if (recruiterBtnDisabled) return;
                            onChoosePlan && onChoosePlan(plan);
                        }}

                        disabled={recruiterBtnDisabled}
                        className={`w-full py-2.5 rounded-xl font-semibold text-sm text-center border transition-all
                            ${recruiterBtnDisabled
                                ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                                : "bg-white text-blue-600 border-blue-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-sm cursor-pointer"
                            }
                        `}
                    >
                        {recruiterBtnLabel}
                    </button>
                    {!!chooseHint && (
                        <p className="mt-2 text-xs text-slate-500">
                            {chooseHint}
                        </p>
                    )}
                </div>
            )}

            {isAdmin && <div className="pb-6"></div>}
        </div>
    );
}