// src/features/applications/pages/MyApplicationDetailPage.jsx

import { useEffect, useState, Fragment } from "react"; // Thêm Fragment
import { useNavigate, useParams } from "react-router-dom";
import dayjs from "dayjs";

import Button from "@/components/ui/Button";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);

// --- HELPER COMPONENTS & ICONS ---
const Icons = {
  Check: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>,
  Clock: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  X: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>,
  FileText: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
  Download: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Eye: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  Building: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  ArrowLeft: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
};

// --- COMPONENT: APPLICATION STEPPER (Cây tiến độ cải tiến) ---
const ApplicationStepper = ({ status, appliedAt, interviewAt }) => { // Thêm prop interviewAt
  const steps = [
    { id: 'applied', label: 'Đã nộp đơn', date: appliedAt },
    { id: 'pending', label: 'Đang xem xét' },
    { id: 'interviewing', label: 'Phỏng vấn', date: interviewAt }, // Hiển thị ngày phỏng vấn nếu có
    { id: 'result', label: 'Kết quả' },
  ];

  // --- LOGIC MỚI: XÁC ĐỊNH BƯỚC HIỆN TẠI ---
  const getCurrentStepIndex = () => {
    // 1. Trạng thái bình thường
    if (status === 'pending') return 1;
    if (status === 'interviewing') return 2;
    if (['accepted', 'rejected'].includes(status)) return 3;

    // 2. LOGIC SỬA LỖI CHO TRẠNG THÁI 'WITHDRAWN'
    if (status === 'withdrawn') {
      // Nếu đã có lịch phỏng vấn (interviewAt) mà rút -> Coi như dừng ở bước 2 (Phỏng vấn)
      // Lưu ý: Backend cần trả về interview_at hoặc bạn check object job/schedule
      if (interviewAt) return 2; 
      
      // Nếu chưa có lịch gì cả mà rút -> Coi như dừng ở bước 1 (Xem xét)
      return 1;
    }

    return 0;
  };

  const currentIndex = getCurrentStepIndex();

  return (
    <div className="w-full py-4">
      <div className="flex items-start w-full">
        {steps.map((step, index) => {
          // Logic trạng thái từng bước
          const isCompleted = index < currentIndex;
          const isActive = index === currentIndex;
          const isLastStep = index === steps.length - 1;

          // Mặc định: Màu xám (chưa tới)
          let circleClass = "bg-white border-2 border-slate-200 text-slate-400";
          let icon = <span className="text-xs font-bold">{index + 1}</span>;
          let labelClass = "text-slate-400";

          // 1. Bước đã qua (Completed) -> Màu xanh dương, tick V
          if (isCompleted) {
            circleClass = "bg-blue-600 border-blue-600 text-white";
            icon = <Icons.Check />;
            labelClass = "text-blue-600 font-medium";
          } 
          // 2. Bước hiện tại (Active) -> Xử lý nhiều case
          else if (isActive) {
             labelClass = "text-slate-800 font-bold";
             
             if (status === 'rejected') {
                // Bị từ chối (Chỉ xảy ra ở bước cuối)
                circleClass = "bg-white border-rose-500 text-rose-500 ring-4 ring-rose-50";
                icon = <Icons.X />;
             } else if (status === 'accepted') {
                // Được nhận
                circleClass = "bg-emerald-500 border-emerald-500 text-white ring-4 ring-emerald-50";
                icon = <Icons.Check />;
             } else if (status === 'withdrawn') {
                // --- ĐÂY LÀ CHỖ HIỂN THỊ ĐÃ RÚT ---
                // Dù ở bước Pending hay Interview, nó sẽ hiện màu xám đậm + dấu X
                circleClass = "bg-slate-500 border-slate-500 text-white ring-4 ring-slate-100";
                icon = <Icons.X />;
                labelClass = "text-slate-500 font-bold";
             } else {
                // Đang xử lý (Pending / Interviewing)
                circleClass = "bg-white border-blue-600 text-blue-600 ring-4 ring-blue-50";
                icon = <Icons.Clock />;
                labelClass = "text-blue-600 font-bold";
             }
          }

          return (
            <Fragment key={step.id}>
              {/* NODE & LABEL */}
              <div className="relative flex flex-col items-center z-10 w-24 -ml-[30px] first:ml-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${circleClass}`}>
                  {icon}
                </div>
                
                <div className="mt-2 flex flex-col items-center text-center">
                  <span className={`text-xs whitespace-nowrap ${labelClass}`}>
                    {step.label}
                  </span>
                  
                  {/* Ngày tháng (nếu có) */}
                  {step.date && (
                    <span className="text-[10px] text-slate-500 mt-0.5">{dayjs(step.date).format("DD/MM")}</span>
                  )}

                  {/* Label trạng thái đặc biệt cho bước hiện tại */}
                  {isActive && status === 'withdrawn' && (
                     <span className="text-[10px] font-bold mt-0.5 uppercase tracking-wide text-slate-500">Đã rút đơn</span>
                  )}
                  {isActive && status === 'rejected' && (
                     <span className="text-[10px] font-bold mt-0.5 uppercase tracking-wide text-rose-500">Từ chối</span>
                  )}
                  {isActive && status === 'accepted' && (
                     <span className="text-[10px] font-bold mt-0.5 uppercase tracking-wide text-emerald-600">Đồng ý</span>
                  )}
                </div>
              </div>

              {/* CONNECTOR LINE */}
              {!isLastStep && (
                <div className="flex-1 mt-4 mx-2 h-[2px] rounded bg-slate-100 relative overflow-hidden">
                   {/* Line chỉ xanh khi bước này ĐÃ QUA (isCompleted) */}
                   <div className={`absolute top-0 left-0 h-full w-full transition-all duration-500 origin-left 
                      ${isCompleted ? 'scale-x-100 bg-blue-600' : 'scale-x-0'} 
                   `} />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

// --- MAIN PAGE COMPONENT ---

export default function MyApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await ApplicationAPI.getMyApplicationDetail(id);
      setApp(res.data?.data || res.data || null);
    } catch (err) {
      console.error("❌ Lỗi load chi tiết đơn ứng tuyển:", err);
      MySwal.fire("Lỗi", "Không tải được chi tiết đơn ứng tuyển.", "error");
    } finally {
      setLoading(false);
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleWithdraw = async () => {
    if (!app || app.status !== "pending") return;

    const confirm = await MySwal.fire({
      title: "Rút đơn ứng tuyển?",
      text: "Bạn sẽ không còn được xem xét cho vị trí này. Hành động này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xác nhận rút đơn",
      cancelButtonText: "Giữ lại",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
    });

    if (!confirm.isConfirmed) return;

    try {
      setActionLoading(true);
      await ApplicationAPI.withdrawMyApplication(id);
      await MySwal.fire({
        title: "Đã rút đơn",
        text: "Trạng thái ứng tuyển đã được cập nhật.",
        icon: "success",
        confirmButtonColor: "#3b82f6"
      });
      fetchDetail();
    } catch (err) {
      console.error("❌ Lỗi rút đơn:", err);
      MySwal.fire("Lỗi", err.response?.data?.message || "Không thể rút đơn ứng tuyển.", "error");
    } finally {
        setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px]">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-medium">Đang tải dữ liệu hồ sơ...</p>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center px-4">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Icons.X />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">Không tìm thấy đơn ứng tuyển</h2>
        <p className="text-slate-500 mb-6">Có thể đơn này đã bị xóa hoặc đường dẫn không tồn tại.</p>
      </div>
    );
  }

  const { job, cv, status, applied_at } = app;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* HEADER / BREADCRUMB */}

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* SECTION 1: STATUS & PROGRESS */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Tiến độ ứng tuyển</h1>
                    <p className="text-slate-500 mt-1">Mã đơn: <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded">#{app.id}</span></p>
                </div>
                {status === "pending" && (
                     <div className="flex-shrink-0">
                        <Button
                            variant="danger"
                            size="sm"
                            disabled={actionLoading}
                            onClick={handleWithdraw}
                            className="bg-red-50 text-red-600 border-red-100 hover:bg-red-100 hover:border-red-200 shadow-none"
                        >
                            {actionLoading ? "Đang xử lý..." : "Rút đơn ứng tuyển"}
                        </Button>
                     </div>
                )}
            </div>
            
            {/* THE PROGRESS TREE (STEPPER) */}
            <div className="px-4 overflow-x-auto">
                <div className="min-w-[500px] md:min-w-0"> {/* Đảm bảo không bị vỡ trên mobile quá nhỏ */}
                    <ApplicationStepper status={status} appliedAt={applied_at} />
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* SECTION 2: JOB DETAILS (Left Column - Larger) */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="p-6 sm:p-8">
                        <div className="flex items-start gap-5">
                            {job?.company?.logo_url ? (
                                <img
                                src={job.company.logo_url}
                                alt={job.company.name}
                                className="w-20 h-20 rounded-xl object-contain border border-slate-100 bg-white shadow-sm"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <Icons.Building />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-tight mb-2">
                                    {job?.title}
                                </h2>
                                <div className="flex items-center gap-2 text-slate-600 mb-4">
                                    <Icons.Building />
                                    <span className="font-medium">{job?.company?.name || "Công ty ẩn danh"}</span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Button 
                                        onClick={() => job?.id && navigate(`/jobs/${job.id}`)} 
                                        variant="outline"
                                        size="sm"
                                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                    >
                                        Xem tin tuyển dụng
                                    </Button>
                                    <Button 
                                        onClick={() => job?.company?.id && navigate(`/companies/${job.company.id}`)} 
                                        variant="ghost"
                                        size="sm"
                                        className="text-slate-600"
                                    >
                                        Xem công ty
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Footer của Job card */}
                    <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate-600">
                         <div className="flex items-center gap-2">
                            <Icons.Clock />
                            <span>Đã nộp: <span className="font-semibold text-slate-800">{dayjs(applied_at).format("HH:mm - DD/MM/YYYY")}</span></span>
                         </div>
                    </div>
                </div>
            </div>

            {/* SECTION 3: CV ATTACHMENT (Right Column) */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sticky top-24">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Icons.FileText />
                        Hồ sơ đính kèm
                    </h3>

                    {cv ? (
                        <div className="bg-blue-50/50 rounded-xl border border-blue-100 p-4">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <span className="font-bold text-xs uppercase">PDF</span>
                                </div>
                                <div className="min-w-0">
                                    <p className="font-semibold text-slate-800 truncate text-sm" title={cv.title}>{cv.title}</p>
                                    <p className="text-xs text-slate-500">{cv.type === "ONLINE" ? "Hồ sơ Online" : "File đính kèm"}</p>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {cv.type === "FILE" && cv.file_url ? (
                                    <>
                                        <button
                                            onClick={() => window.open(cv.file_url, "_blank")}
                                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                        >
                                            <Icons.Eye /> Xem
                                        </button>
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(cv.file_url);
                                                    const blob = await response.blob();
                                                    const url = window.URL.createObjectURL(blob);
                                                    const a = document.createElement("a");
                                                    a.href = url;
                                                    a.download = cv.title || "cv.pdf";
                                                    document.body.appendChild(a);
                                                    a.click();
                                                    document.body.removeChild(a);
                                                } catch (e) {
                                                    console.error(e);
                                                    window.open(cv.file_url, "_blank");
                                                }
                                            }}
                                            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                        >
                                            <Icons.Download /> Tải về
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => MySwal.fire({ title: "CV Online", text: "Tính năng xem trước đang cập nhật", icon: "info" })}
                                        className="col-span-2 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 hover:text-blue-600 transition-colors"
                                    >
                                        <Icons.Eye /> Xem chi tiết
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="text-sm text-slate-500">Không có CV đính kèm</p>
                        </div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
}