import { useEffect, useMemo, useState } from "react";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import InterviewAPI from "@/features/interviews/InterviewAPI";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import toast from "react-hot-toast";

const MySwal = withReactContent(Swal);

export default function CvManagementPage() {
  const [filters, setFilters] = useState({
    search: "",
    jobId: "",
    status: "",
  });

  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id đang xử lý accept/reject
  const [isInterviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewSubmitting, setInterviewSubmitting] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [interviewForm, setInterviewForm] = useState({
    datetime: "",
    mode: "online",
    note: "",
  });

  const applicantName = useMemo(() => {
    if (!selectedApplication) return "";
    return (
      selectedApplication.candidate?.user?.full_name ||
      selectedApplication.candidate?.user?.account?.email ||
      "Ứng viên"
    );
  }, [selectedApplication]);

  // 🧩 Hàm gọi API lấy danh sách ứng viên
  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const res = await ApplicationAPI.getByCompany({
        page: 1,
        limit: 10,
        search: filters.search || undefined,
        jobId: filters.jobId || undefined,
        status: filters.status || undefined,
        ...params,
      });

      const data = res.data?.data || {};
      setApplications(data.items || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách ứng viên:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Khi dropdown (jobId, status) thay đổi → auto gọi API
  useEffect(() => {
    if (filters.jobId !== "" || filters.status !== "") {
      fetchData();
    }
  }, [filters.jobId, filters.status]);

  // 📦 Hàm xử lý thay đổi input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // 🎯 Khi nhấn nút Tìm kiếm hoặc Enter trong textbox
  const handleSearch = (e) => {
    if (!e || e.key === "Enter") {
      fetchData();
    }
  };

  // 🧩 Khi nhấn chấp nhận / từ chối
  const handleAction = async (id, action) => {
    const actionText = action === "accept" ? "chấp nhận" : "từ chối";
    try {
      const confirm = await MySwal.fire({
        title: `Xác nhận ${actionText}?`,
        text: `Bạn có chắc muốn ${actionText} đơn ứng tuyển này không?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Có",
        cancelButtonText: "Hủy",
        confirmButtonColor: action === "accept" ? "#16a34a" : "#dc2626",
      });
      if (!confirm.isConfirmed) return;

      setActionLoading(id);

      if (action === "accept") {
        await ApplicationAPI.accept(id);
      } else {
        await ApplicationAPI.reject(id);
      }

      await MySwal.fire({
        title: "Thành công!",
        text: `Đã ${actionText} đơn ứng tuyển.`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#2563eb",
      });

      fetchData();
    } catch (err) {
      console.error("❌ Lỗi khi cập nhật trạng thái:", err);
      MySwal.fire({
        title: "Lỗi!",
        text: err.response?.data?.message || "Không thể cập nhật trạng thái.",
        icon: "error",
        confirmButtonText: "Đóng",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const openInterviewModal = (application) => {
    setSelectedApplication(application);
    setInterviewForm({
      datetime: "",
      mode: "online",
      note: "",
    });
    setInterviewModalOpen(true);
  };

  const closeInterviewModal = () => {
    setInterviewModalOpen(false);
    setSelectedApplication(null);
    setInterviewSubmitting(false);
  };

  const handleInterviewFormChange = (event) => {
    const { name, value } = event.target;
    setInterviewForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateInterview = async (event) => {
    event.preventDefault();
    if (!selectedApplication) return;

    try {
      setInterviewSubmitting(true);
      await InterviewAPI.create({
        application_id: selectedApplication.id,
        scheduled_at: interviewForm.datetime,
        mode: interviewForm.mode,
        note: interviewForm.note,
      });
      toast.success("Đã tạo lịch phỏng vấn thành công");
      closeInterviewModal();
      fetchData();
    } catch (error) {
      const message =
        error?.response?.data?.message || "Không thể tạo lịch phỏng vấn";
      toast.error(message);
      setInterviewSubmitting(false);
    }
  };

  // 🔹 Load lần đầu
  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          Quản lý CV ứng viên
        </h1>

        {/* Bộ lọc */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Ô tìm kiếm */}
          <div onKeyDown={handleSearch}>
            <TextInput
              name="search"
              placeholder="Tìm kiếm tên, email, số điện thoại"
              value={filters.search}
              onChange={handleChange}
            />
          </div>

          {/* Dropdown chọn công việc */}
          <SelectInput
            name="jobId"
            value={filters.jobId}
            onChange={handleChange}
            placeholder="Chọn công việc"
            options={[
              { value: "", label: "Tất cả công việc" },
              { value: "41", label: "Mobile Developer (Flutter)" },
              { value: "42", label: "Backend Developer" },
            ]}
          />

          {/* Dropdown trạng thái */}
          <SelectInput
            name="status"
            value={filters.status}
            onChange={handleChange}
            placeholder="Trạng thái"
            options={[
              { value: "", label: "Tất cả trạng thái" },
              { value: "pending", label: "Đang chờ" },
              { value: "accepted", label: "Đã chấp nhận" },
              { value: "rejected", label: "Đã từ chối" },
            ]}
          />
        </div>

        {/* Nút tìm kiếm */}
        <div className="flex justify-end mt-4">
          <Button onClick={() => fetchData()} size="sm" variant="primary">
            Tìm kiếm
          </Button>
        </div>
      </div>

      {/* Kết quả */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
        <p className="font-medium text-slate-700 mb-4">
          Tìm thấy{" "}
          <span className="font-semibold text-blue-600">{total}</span>{" "}
          ứng viên
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 text-sm font-semibold">
                <th className="p-3 text-left rounded-l-lg">Ứng viên</th>
                <th className="p-3 text-left">Tên job</th>
                <th className="p-3 text-left">Thông tin liên hệ</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-center">Phỏng vấn</th>
                <th className="p-3 text-center rounded-r-lg">Thao tác</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : applications.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-slate-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                applications.map((item) => {
                  const isActionDisabled =
                    item.status !== "pending" || actionLoading === item.id;

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      {/* Ứng viên */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.candidate?.user?.avatar_url ||
                              "https://i.pravatar.cc/100"
                            }
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <span className="font-medium text-slate-800">
                            {item.candidate?.user?.full_name || "Chưa có tên"}
                          </span>
                        </div>
                      </td>

                      {/* Tên job */}
                      <td className="p-3 text-slate-700">
                        {item.job?.title || "—"}
                      </td>

                      {/* Liên hệ */}
                      <td className="p-3 text-slate-700">
                        <div className="flex flex-col">
                          <span>{item.candidate?.user?.account?.email}</span>
                          <span>{item.candidate?.user?.phone}</span>
                        </div>
                      </td>

                      {/* Trạng thái */}
                      <td className="p-3 text-center">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${
                            item.status === "accepted"
                              ? "bg-green-100 text-green-700"
                              : item.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {item.status === "accepted"
                            ? "Đã chấp nhận"
                            : item.status === "rejected"
                            ? "Đã từ chối"
                            : "Đang chờ"}
                        </span>
                      </td>

                      {/* Thông tin phỏng vấn */}
                      <td className="p-3 text-center">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => openInterviewModal(item)}
                        >
                          Lên lịch
                        </Button>
                      </td>

                      {/* Thao tác */}
                      <td className="p-3 text-center space-x-2">
                        <Button
                          size="sm"
                          variant="green"
                          onClick={() => handleAction(item.id, "accept")}
                          disabled={isActionDisabled}
                          className={
                            item.status !== "pending"
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }
                        >
                          {actionLoading === item.id
                            ? "Đang xử lý..."
                            : "Chấp nhận"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAction(item.id, "reject")}
                          disabled={isActionDisabled}
                          className={
                            item.status !== "pending"
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }
                        >
                          {actionLoading === item.id ? "..." : "Từ chối"}
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isInterviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-800">
                Lên lịch phỏng vấn
              </h3>
              <button
                type="button"
                className="text-slate-400 transition hover:text-slate-600"
                onClick={closeInterviewModal}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <p className="mb-6 text-sm text-slate-600">
              Gửi lịch phỏng vấn cho <span className="font-semibold">{applicantName}</span>.
            </p>

            <form onSubmit={handleCreateInterview} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Thời gian phỏng vấn
                </label>
                <input
                  type="datetime-local"
                  name="datetime"
                  value={interviewForm.datetime}
                  onChange={handleInterviewFormChange}
                  required
                  className={
                    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm " +
                    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  }
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Hình thức
                </label>
                <select
                  name="mode"
                  value={interviewForm.mode}
                  onChange={handleInterviewFormChange}
                  className={
                    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm " +
                    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  }
                >
                  <option value="online">Online</option>
                  <option value="offline">Offline</option>
                  <option value="call">Gọi điện</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Ghi chú
                </label>
                <textarea
                  name="note"
                  value={interviewForm.note}
                  onChange={handleInterviewFormChange}
                  rows={4}
                  placeholder="Thông tin địa điểm, link meeting..."
                  className={
                    "w-full rounded-lg border border-slate-200 px-3 py-2 text-sm " +
                    "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  }
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeInterviewModal}
                  disabled={interviewSubmitting}
                >
                  Huỷ
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={interviewSubmitting}>
                  {interviewSubmitting ? "Đang gửi..." : "Gửi lịch"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
