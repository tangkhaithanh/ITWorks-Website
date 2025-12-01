import { useEffect, useState } from "react";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
// Nếu cần, chỉnh lại path JobAPI cho đúng với project của bạn
import JobAPI from "@/features/jobs/JobAPI";
import { useNavigate } from "react-router-dom";

const PAGE_SIZE = 10;

// Map trạng thái job → text + màu
const getStatusInfo = (status) => {
  switch (status) {
    case "active":
      return {
        label: "Đang tuyển",
        className: "bg-green-100 text-green-700",
      };
    case "hidden":
      return {
        label: "Đang ẩn",
        className: "bg-slate-100 text-slate-700",
      };
    case "closed":
      return {
        label: "Đã đóng",
        className: "bg-rose-100 text-rose-700",
      };
    case "expired":
      return {
        label: "Hết hạn",
        className: "bg-amber-100 text-amber-700",
      };
    default:
      return {
        label: status || "Không rõ",
        className: "bg-slate-100 text-slate-700",
      };
  }
};

// Format lương từ salary_min / salary_max / negotiable
const formatSalary = (job) => {
  const { salary_min, salary_max, negotiable } = job || {};

  if (negotiable) return "Thoả thuận";

  const hasMin = salary_min !== null && salary_min !== undefined;
  const hasMax = salary_max !== null && salary_max !== undefined;

  if (hasMin && hasMax) return `${salary_min} - ${salary_max} triệu`;
  if (hasMin) return `Từ ${salary_min} triệu`;
  if (hasMax) return `Đến ${salary_max} triệu`;

  return "Chưa cập nhật";
};

export default function ManageJobPage() {
  // ─────────────────────────────────────────
  // State
  // ─────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: "", // tìm theo title
    status: "", // JobStatus: active | hidden | closed | expired
  });

  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const limit = PAGE_SIZE;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const navigate = useNavigate();

  // ─────────────────────────────────────────
  // Fetch data
  // ─────────────────────────────────────────
  const fetchData = async (params = {}) => {
    try {
      setLoading(true);

      const currentPage = params.page || page || 1;

      const res = await JobAPI.getByCompany({
        page: currentPage,
        limit,
        search: filters.search || undefined,
        status: filters.status || undefined,
        ...params,
      });

      const data = res.data?.data || res.data || {};
      setJobs(data.items || []);
      setTotal(data.total || 0);
      setPage(data.page || currentPage);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách job:", err);
    } finally {
      setLoading(false);
    }
  };

  // Lần đầu load
  useEffect(() => {
    fetchData({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Khi đổi trạng thái → tự fetch lại (tư duy giống CvManagementPage)
  useEffect(() => {
    fetchData({ page: 1 });
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status]);

  // ─────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // Tìm kiếm: Enter hoặc bấm nút
  const handleSearch = (e) => {
    if (!e || e.key === "Enter") {
      setPage(1);
      fetchData({ page: 1 });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages || newPage === page) return;
    setPage(newPage);
    fetchData({ page: newPage });
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="space-y-6">
  {/* Header + bộ lọc */}
  <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">

    {/* Header + Button */}
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-slate-800">
        Quản lý tin tuyển dụng
      </h1>

      <Button
        variant="primary"
        size="sm"
        className="px-6"
        onClick={() => navigate("/recruiter/jobs/create")}
      >Thêm tin
      </Button>
    </div>

    {/* Bộ lọc */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Tìm kiếm theo title */}
      <div className="md:col-span-2" onKeyDown={handleSearch}>
        <TextInput
          name="search"
          placeholder="Tìm kiếm theo tiêu đề công việc"
          value={filters.search}
          onChange={handleChange}
        />
      </div>

      {/* Lọc theo trạng thái */}
      <SelectInput
        name="status"
        value={filters.status}
        onChange={handleChange}
        placeholder="Trạng thái"
        options={[
          { value: "", label: "Tất cả trạng thái" },
          { value: "active", label: "Đang tuyển" },
          { value: "hidden", label: "Đang ẩn" },
          { value: "closed", label: "Đã đóng" },
          { value: "expired", label: "Hết hạn" },
        ]}
      />
    </div>

    {/* Nút tìm kiếm */}
    <div className="flex justify-end mt-4">
      <Button onClick={() => handleSearch()} size="sm" variant="primary">
        Tìm kiếm
      </Button>
    </div>

  </div>

      {/* Danh sách job */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
        <div className="flex items-center justify-between mb-4">
          <p className="font-medium text-slate-700">
            Tìm thấy{" "}
            <span className="font-semibold text-blue-600">{total}</span>{" "}
            tin tuyển dụng
          </p>

          {total > 0 && (
            <p className="text-sm text-slate-500">
              Hiển thị {jobs.length} / {total} job
            </p>
          )}
        </div>

        <div className="w-full overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-sm font-semibold">
                  <th className="p-3 text-left">Tiêu đề</th>
                  <th className="p-3 text-left">Mức lương</th>
                  <th className="p-3 text-left">Địa điểm</th>
                  <th className="p-3 text-center">Trạng thái</th>
                  <th className="p-3 text-center">Số đơn ứng tuyển</th>
                </tr>
              </thead>

              <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : jobs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                jobs.map((job) => {
                  const { label: statusLabel, className: statusClass } =
                    getStatusInfo(job.status);

                  const applicationsCount = job._count?.applications ?? 0;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                      className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                    >
                      {/* Title */}
                      <td className="p-3">
                        <p className="font-semibold text-slate-800 truncate">
                          {job.title || "—"}
                        </p>
                      </td>

                      {/* Salary */}
                      <td className="p-3">
                        <p className="text-slate-700">{formatSalary(job)}</p>
                      </td>

                      {/* Location */}
                      <td className="p-3">
                        <p className="text-slate-700 truncate">
                          {job.location_full || "Chưa cập nhật"}
                        </p>
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}
                        >
                          {statusLabel}
                        </span>
                      </td>

                      {/* Applications count */}
                      <td className="p-3 text-center">
                        <span className="font-semibold text-slate-800">
                          {applicationsCount}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
          </div>
        </div>

        {/* Phân trang */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-600">
              Trang <span className="font-semibold">{page}</span> /{" "}
              <span className="font-semibold">{totalPages}</span>
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page - 1)}
                disabled={page === 1 || loading}
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(page + 1)}
                disabled={page === totalPages || loading}
              >
                Trang sau
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
