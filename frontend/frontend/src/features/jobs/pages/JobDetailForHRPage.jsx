// src/features/jobs/pages/JobDetailForHRPage.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import JobAPI from "@/features/jobs/JobAPI";

import { Card, CardHeader, CardBody } from "@/components/common/Card";
import TagList from "@/components/common/TagList";
import EmptyState from "@/components/common/EmptyState";
import Swal from "sweetalert2";
import DatePickerInput from "@/components/ui/DatePickerInput";
// =======================
//  Helpers mapping
// =======================

const EMPLOYMENT_TYPE_LABELS = {
  fulltime: "Toàn thời gian",
  parttime: "Bán thời gian",
  internship: "Thực tập",
  contract: "Hợp đồng",
  freelance: "Freelance",
};

const WORK_MODE_LABELS = {
  onsite: "Làm tại văn phòng",
  remote: "Làm từ xa",
  hybrid: "Hybrid",
};

const EXPERIENCE_LEVEL_LABELS = {
  fresher: "Fresher",
  junior: "Junior",
  mid: "Middle",
  senior: "Senior",
  lead: "Lead",
  manager: "Manager",
};

const JOB_STATUS_META = {
  active: {
    label: "Đang tuyển",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
  hidden: {
    label: "Đang ẩn",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  },
  closed: {
    label: "Đã đóng",
    className: "bg-rose-50 text-rose-700 border-rose-200",
  },
  expired: {
    label: "Hết hạn",
    className: "bg-orange-50 text-orange-700 border-orange-200",
  },
};

const formatSalaryRange = (job) => {
  if (!job) return "—";
  if (job.negotiable) return "Thỏa thuận";

  if (job.salary_min && job.salary_max) {
    return `${Number(job.salary_min)} - ${Number(job.salary_max)} triệu`;
  }
  if (job.salary_min) {
    return `Từ ${Number(job.salary_min)} triệu`;
  }
  if (job.salary_max) {
    return `Tối đa ${Number(job.salary_max)} triệu`;
  }

  return "—";
};

const formatDate = (v) => {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleDateString("vi-VN");
  } catch {
    return v;
  }
};


// =======================
//  MAIN COMPONENT
// =======================

export default function JobDetailForHRPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [extendOpen, setExtendOpen] = useState(false);
  const [newDeadline, setNewDeadline] = useState("");
  const [extendError, setExtendError] = useState("");

  const fetchJob = async () => {
    try {
      setLoading(true);
      const res = await JobAPI.getJobToEdit(id);
      setJob(res.data?.data || null);
    } catch (err) {
      console.error("Lỗi lấy job:", err);
      setJob(null);
    } finally {
      setLoading(false);
    }
  };
  const handleHide = async () => {
  const confirm = await Swal.fire({
    title: "Ẩn job?",
    text: "Job sẽ không hiển thị với ứng viên.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Ẩn ngay",
    cancelButtonText: "Hủy",
  });

  if (!confirm.isConfirmed) return;

  Swal.fire({
    title: "Đang xử lý...",
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
  });

  try {
    await JobAPI.hide(job.id);
    await fetchJob();

    Swal.fire({
      icon: "success",
      title: "Đã ẩn job!",
      timer: 1300,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Lỗi",
      text: "Không thể ẩn job.",
    });
  }
};


  const handleUnhide = async () => {
    const confirm = await Swal.fire({
      title: "Hiện lại job?",
      text: "Job sẽ xuất hiện với ứng viên.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Hiện ngay",
      cancelButtonText: "Hủy",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Đang xử lý...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    try {
      await JobAPI.unhide(job.id);
      await fetchJob();

      Swal.fire({
        icon: "success",
        title: "Đã hiện lại job!",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Không thể hiện lại job.",
      });
    }
  };


  const handleClose = async () => {
    const confirm = await Swal.fire({
      title: "Đóng Công việc?",
      text: "Bạn sẽ không thể nhận ứng viên cho công việc này nữa, bạn cũng không thể mở lại công việc đã đóng. Bạn có chắc chắn muốn đóng?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Đóng",
      cancelButtonText: "Hủy",
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "Đang xử lý...",
      didOpen: () => Swal.showLoading(),
      allowOutsideClick: false,
    });

    try {
      await JobAPI.close(job.id);
      await fetchJob();

      Swal.fire({
        icon: "success",
        title: "Job đã được đóng!",
        timer: 1300,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "Không thể đóng job.",
      });
    }
  };


   const handleExtend = () => {
  setExtendError("");
  setNewDeadline("");
  setExtendOpen(true);
};

const handleSubmitExtend = async () => {
  if (!newDeadline) {
    setExtendError("Vui lòng chọn ngày gia hạn");
    return;
  }

  const today = new Date();
  const picked = new Date(newDeadline + "T00:00:00");

  if (picked <= today) {
    setExtendError("Ngày mới phải lớn hơn ngày hôm nay");
    return;
  }

  Swal.fire({
    title: "Đang cập nhật...",
    didOpen: () => Swal.showLoading(),
    allowOutsideClick: false,
  });

  try {
    await JobAPI.resetDeadline(job.id, { newDeadline });
    setExtendOpen(false);
    await fetchJob();

    Swal.fire({
      icon: "success",
      title: "Đã gia hạn thành công!",
      timer: 1500,
      showConfirmButton: false,
    });
  } catch (err) {
    console.error(err);
    Swal.fire({
      icon: "error",
      title: "Không thể gia hạn deadline",
    });
  }
};
  // Chạy fetchJob khi id thay đổis
  useEffect(() => {
    if (id) fetchJob();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-10 text-slate-500">
        Đang tải thông tin công việc...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white p-8 rounded-xl border shadow text-center max-w-lg mx-auto mt-10">
        <h2 className="text-xl font-bold text-slate-900 mb-2">
          Không tìm thấy công việc
        </h2>
        <p className="text-slate-600 mb-4">
          Vui lòng kiểm tra lại đường dẫn hoặc quay lại danh sách job.
        </p>
        <Button variant="outline" onClick={() => navigate("/recruiter/jobs")}>
          Quay lại danh sách
        </Button>
      </div>
    );
  }

  // Helper variables
  const statusMeta = JOB_STATUS_META[job.status] || { label: job.status, className: "" };
  
  const experienceLevels = (job.experience_levels || []).map(
    (e) => EXPERIENCE_LEVEL_LABELS[e] || e
  );

  const workModes = (job.work_modes || []).map(
    (w) => WORK_MODE_LABELS[w] || w
  );

  const company = job.company;

  return (
  <div className="min-h-screen bg-slate-50">
    {/* HEADER */}
    <header className="border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          <div className="lg:col-span-2">

            {/* STATUS + META */}
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusMeta.className}`}
              >
                {statusMeta.label}
              </span>

              <span className="text-xs text-slate-400">#{job.id}</span>

              <span className="text-xs text-slate-400">
                · Cập nhật {formatDate(job.updated_at)}
              </span>
            </div>

            {/* TITLE + COMPANY */}
            <div className="mb-4">
              <h1 className="mb-2 text-2xl font-bold text-slate-900 sm:text-3xl">
                {job.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3 text-slate-600 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">🏢</span>
                  <span className="font-medium">{company?.name || "Chưa cập nhật công ty"}</span>
                </div>

                {job.location_city && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">📍</span>
                      <span>{job.location_city}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* ACTIONS */}
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/recruiter/jobs")}>
                ← Quay lại
              </Button>
              {job.status !== "closed" && (
              <Button
                size="sm"
                onClick={() => navigate(`/recruiter/jobs/${job.id}/edit`)}
                className="flex items-center gap-2"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Chỉnh sửa
              </Button>
              )}

              {/* HIDDEN → UNHIDE */}
                {job.status === "hidden" && (
                  <Button variant="secondary" size="sm" onClick={handleUnhide}>
                    👁️ Hiện lại
                  </Button>
                )}

                {/* ACTIVE → HIDE */}
                {job.status === "active" && (
                  <Button variant="secondary" size="sm" onClick={handleHide}>
                    🙈 Ẩn job
                  </Button>
                )}

                {/* NOT CLOSED → CLOSE */}
                {job.status === "active" && (
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    🛑 Đóng job
                  </Button>
                )}

                {/* EXPIRED → EXTEND */}
                {job.status === "expired" && (
                  <Button variant="green" size="sm" onClick={handleExtend}>
                    ⏳ Gia hạn
                  </Button>
                )}
            </div>

          </div>
          <div className="hidden lg:block"></div>
        </div>
      </div>
    </header>


    {/* MAIN */}
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
        {/* LEFT: Main content (2/3) */}
        <section className="space-y-6 lg:col-span-2">
          {/* Job Detail */}
          <Card>
            <CardHeader icon="📝" title="Chi tiết công việc" />
            <CardBody className="space-y-6">
              {/* Description */}
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mô tả công việc
                </p>

                {job.description ? (
                  <div
                    className="prose prose-sm prose-slate max-w-none rounded-lg border border-slate-100 bg-slate-50 p-4"
                    dangerouslySetInnerHTML={{ __html: job.description }}
                  />
                ) : (
                  <EmptyState />
                )}
              </div>

              {/* Requirements */}
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Yêu cầu ứng viên
                </p>

                {job.requirements ? (
                  <div
                    className="prose prose-sm prose-slate max-w-none rounded-lg border border-slate-100 bg-slate-50 p-4"
                    dangerouslySetInnerHTML={{ __html: job.requirements }}
                  />
                ) : (
                  <EmptyState />
                )}
              </div>
            </CardBody>
          </Card>

          {/* Bạn có thể thêm card về công ty / phúc lợi ở đây sau này */}
        </section>

        {/* RIGHT: Sidebar (1/3) */}
        <aside className="space-y-6">
          {/* Salary & key info */}
          <Card>
            <CardHeader icon="💰" title="Thông tin chính" />
            <CardBody className="space-y-5">
              {/* Salary */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Mức lương
                </p>
                <p className="mb-1 text-xl font-bold text-emerald-600">
                  {formatSalaryRange(job)}
                </p>
                {job.negotiable && (
                  <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                    Có thể thương lượng
                  </span>
                )}
              </div>

              {/* Employment type */}
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Hình thức làm việc
                </p>
                <p className="text-sm font-medium text-slate-900">
                  {EMPLOYMENT_TYPE_LABELS[job.employment_type]}
                </p>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    Hạn nộp
                  </p>
                  <p className="font-medium text-slate-900">
                    {job.deadline ? formatDate(job.deadline) : "Không rõ"}
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    Ngày đăng
                  </p>
                  <p className="font-medium text-slate-900">
                    {formatDate(job.created_at)}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Experience & skills */}
          <Card>
            <CardHeader icon="🎯" title="Yêu cầu ứng viên" />
            <CardBody className="space-y-5">
              {/* Level */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Cấp bậc
                </p>
                {experienceLevels.length > 0 ? (
                  <TagList items={experienceLevels} color="purple" />
                ) : (
                  <p className="text-sm text-slate-400">Không yêu cầu</p>
                )}
              </div>

              {/* Skills */}
              <div className="border-t border-slate-100 pt-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Kỹ năng
                </p>
                {job.skills?.length ? (
                  <TagList items={job.skills} color="blue" />
                ) : (
                  <p className="text-sm text-slate-400">
                    Không yêu cầu cụ thể
                  </p>
                )}
              </div>
            </CardBody>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader icon="📍" title="Địa điểm làm việc" />
            <CardBody className="space-y-5">
              {/* Work mode */}
              <div>
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Chế độ làm việc
                </p>
                {workModes.length > 0 ? (
                  <TagList items={workModes} color="orange" />
                ) : (
                  <p className="text-sm text-slate-400">Không xác định</p>
                )}
              </div>

              {/* Address */}
              <div className="border-t border-slate-100 pt-4 text-sm">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                  Địa chỉ
                </p>
                <p className="mb-1 leading-relaxed text-slate-700">
                  {job.location?.full ||
                    job.location_full ||
                    "Chưa cập nhật"}
                </p>
                {(job.location_district || job.location_city) && (
                  <p className="text-xs text-slate-500">
                    {[job.location_district, job.location_city]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
              </div>
            </CardBody>
          </Card>
        </aside>
      </div>
    </main>
    <Modal
      open={extendOpen}
      onClose={() => setExtendOpen(false)}
      title="Gia hạn công việc"
      width="max-w-md"
    >
      <div className="space-y-4">
        <DatePickerInput
          label="Chọn deadline mới"
          name="newDeadline"
          value={newDeadline}
          onChange={(e) => {
            setNewDeadline(e.target.value);
            setExtendError("");
          }}
          placeholderText="Chọn ngày"
          required
          error={extendError}
          minDate={new Date()} // CHẶN NGÀY QUÁ KHỨ
        />

        <div className="flex justify-end gap-2 pt-3">
          <Button variant="outline" onClick={() => setExtendOpen(false)}>
            Hủy
          </Button>
          <Button variant="green" onClick={handleSubmitExtend}>
            Lưu
          </Button>
        </div>
      </div>
    </Modal>
  </div>
);
}