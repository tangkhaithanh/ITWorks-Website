import { useEffect, useState } from "react";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import CandidateAPI from "@/features/candidates/CandidateAPI";
const MySwal = withReactContent(Swal);

export default function CvManagementPage() {
  // ───────────────────────────────────────
  // 🔹 State quản lý
  // ───────────────────────────────────────
  const [filters, setFilters] = useState({
    search: "",
    jobId: "",
    status: "",
  });
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // id đang xử lý

  // ───────────────────────────────────────
  // 🔹 Lấy danh sách đơn ứng tuyển
  // ───────────────────────────────────────
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (filters.jobId !== "" || filters.status !== "") fetchData();
  }, [filters.jobId, filters.status]);

  // ───────────────────────────────────────
  // 🔹 Xử lý thay đổi input / filter
  // ───────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    if (!e || e.key === "Enter") fetchData();
  };

  // ───────────────────────────────────────
  // 🔹 Hành động chấp nhận / từ chối
  // ───────────────────────────────────────
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

      if (action === "accept") await ApplicationAPI.accept(id);
      else await ApplicationAPI.reject(id);

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

  // ───────────────────────────────────────
  // 🔹 Mở CV ở tab mới
  // ───────────────────────────────────────
  const handleViewCv = async (item) => {
  try {
    const filename = item.cv?.file_public_id?.replace(/^cvs\//, "") || item.cv?.id;
    if (!filename) {
      return MySwal.fire({
        title: "Không tìm thấy CV",
        icon: "warning",
      });
    }

    const res = await CandidateAPI.viewCv(filename);
    const blob = new Blob([res.data], { type: "application/pdf" });
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  } catch (err) {
    console.error("❌ Lỗi khi xem CV:", err);
    MySwal.fire({
      title: "Lỗi khi xem CV",
      text: "Không thể tải file CV. Vui lòng thử lại.",
      icon: "error",
    });
  }
};

  // ───────────────────────────────────────
  // 🔹 Render
  // ───────────────────────────────────────
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

      {/* Danh sách CV */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
        <p className="font-medium text-slate-700 mb-4">
          Tìm thấy{" "}
          <span className="font-semibold text-blue-600">{total}</span>{" "}
          ứng viên
        </p>

        <div className="w-full overflow-hidden rounded-lg border border-slate-200">
          <div className="w-full overflow-hidden rounded-lg border border-slate-200">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 text-sm font-semibold">
              <th className="p-3 text-left w-60 min-w-[180px]">Ứng viên</th>
              <th className="p-3 text-left w-40 min-w-[120px]">Tên job</th>
              <th className="p-3 text-left w-36 min-w-[100px]">Tên CV</th>
              <th className="p-3 text-left w-44 min-w-[120px]">Liên hệ</th>
              <th className="p-3 text-center w-32 min-w-[110px]">Trạng thái</th>
              <th className="p-3 text-center w-48 min-w-[170px]">Thao tác</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-6 text-slate-500">
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
                    {/* Ứng viên - Hiển thị đầy đủ tên */}
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          <img
                            src={
                              item.candidate?.user?.avatar_url ||
                              "https://i.pravatar.cc/100"
                            }
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">
                            {item.candidate?.user?.full_name || "Chưa có tên"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Tên job */}
                    <td className="p-3">
                      <div className="min-w-0">
                        <p className="text-slate-700 truncate">
                          {item.job?.title || "—"}
                        </p>
                      </div>
                    </td>

                    {/* Tên CV (click để mở) - Thu gọn lại */}
                    <td className="p-3">
                      <div className="min-w-0">
                        {item.cv ? (
                          <button
                            onClick={() => handleViewCv(item)}
                            className="text-left truncate text-blue-600 font-medium hover:text-blue-800 cursor-pointer transition-colors"
                            title={item.cv?.title || "Xem CV"}
                          >
                            {item.cv?.title 
                              ? (item.cv.title.length > 15 
                                ? item.cv.title.substring(0, 15) + "..." 
                                : item.cv.title)
                              : "Xem CV"}
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </div>
                    </td>

                    {/* Liên hệ */}
                    <td className="p-3">
                      <div className="flex flex-col min-w-0">
                        <p className="text-slate-700 truncate">
                          {item.candidate?.user?.account?.email || "—"}
                        </p>
                        <p className="text-slate-700 truncate">
                          {item.candidate?.user?.phone || "—"}
                        </p>
                      </div>
                    </td>

                    {/* Trạng thái - Giữ nguyên kích thước */}
                    <td className="p-3 text-center">
                      <span
                        className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${
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

                    {/* Thao tác - Đảm bảo đủ không gian */}
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="green"
                          onClick={() => handleAction(item.id, "accept")}
                          disabled={isActionDisabled}
                          className="px-3 py-1 h-8"
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
                          className="px-3 py-1 h-8"
                        >
                          {actionLoading === item.id ? "..." : "Từ chối"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
    </div>
      </div>
    </div>
  );
}
