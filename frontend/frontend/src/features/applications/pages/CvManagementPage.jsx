import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TextInput from "@/components/ui/TextInput";
import SelectInput from "@/components/ui/SelectInput";
import Button from "@/components/ui/Button";
import ApplicationAPI from "@/features/applications/ApplicationAPI";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import CandidateAPI from "@/features/candidates/CandidateAPI";
import JobAPI from "../../jobs/JobAPI";
const MySwal = withReactContent(Swal);

export default function CvManagementPage() {
  const navigate = useNavigate();

  // ─────────────────────────────────────────
  // State
  // ─────────────────────────────────────────
  const [filters, setFilters] = useState({
    search: "",
    jobId: "",
    status: "",
  });
  const [jobOptions, setJobOptions] = useState([]);
  const [applications, setApplications] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  // ─────────────────────────────────────────
  // Fetch data
  // ─────────────────────────────────────────
  const fetchData = async (params = {}) => {
    try {
      setLoading(true);

      const res = await ApplicationAPI.getByCompany({
        page: 1,
        limit: 10,
        search: filters.search || undefined,
        jobId: filters.jobId ? Number(filters.jobId) : undefined,
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

  const fetchJobOptions = async () => {
    try {
      const res = await JobAPI.getJobsForDropdown();
      const jobs = res.data?.data || [];
      setJobOptions(jobs);
    } catch (err) {
      console.error("❌ Lỗi lấy danh sách công việc:", err);
    }
  };

  // Chuẩn bị options cho dropdown
  const jobSelectOptions = [
    { value: "", label: "Tất cả công việc" },
    ...jobOptions.map(job => ({
      value: String(job.id),
      label: job.title,
    })),
  ];
  // Chạy lần đầu khi mount
  useEffect(() => {
    fetchData();
    fetchJobOptions();
  }, []);

  useEffect(() => {
  fetchData();
}, [filters.jobId, filters.status]);

  // ─────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    if (!e || e.key === "Enter") fetchData();
  };

  // Xem CV
  const handleViewCv = async (item) => {
    try {
      const filename =
        item.cv?.file_public_id?.replace(/^cvs\//, "") || item.cv?.id;

      if (!filename) {
        return MySwal.fire({
          title: "Không tìm thấy CV",
          icon: "warning",
        });
      }

      const res = await CandidateAPI.viewCv(filename);
      const blob = new Blob([res.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err) {
      console.error("❌ Lỗi khi xem CV:", err);
      MySwal.fire({
        title: "Lỗi khi xem CV",
        text: "Không thể tải file CV. Vui lòng thử lại.",
        icon: "error",
      });
    }
  };

  // ─────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-100">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">
          Quản lý CV ứng viên
        </h1>

        {/* Bộ lọc */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div onKeyDown={handleSearch}>
            <TextInput
              name="search"
              placeholder="Tìm kiếm tên, email, số điện thoại"
              value={filters.search}
              onChange={handleChange}
            />
          </div>

          <SelectInput
            name="jobId"
            value={filters.jobId}
            onChange={handleChange}
            placeholder="Chọn công việc"
            options={jobSelectOptions}
          />

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
              { value: "interviewing", label: "Đã lên lịch phỏng vấn" }
            ]}
          />
        </div>

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
          <span className="font-semibold text-blue-600">{total}</span> ứng viên
        </p>

        <div className="w-full overflow-hidden rounded-lg border border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 text-sm font-semibold">
                  <th className="p-3 text-left">Ứng viên</th>
                  <th className="p-3 text-left">Công việc</th>
                  <th className="p-3 text-center">Trạng thái</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={3} className="text-center py-6 text-slate-500">
                      Đang tải dữ liệu...
                    </td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-6 text-slate-500">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  applications.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition cursor-pointer"
                    >
                      {/* Ứng viên */}
                      <td
                        className="p-3"
                        onClick={() =>
                          navigate(`/recruiter/applications/${item.id}`)
                        }
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.candidate?.user?.avatar_url ||
                              "https://i.pravatar.cc/100"
                            }
                            alt="avatar"
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <p className="font-medium text-slate-800">
                            {item.candidate?.user?.full_name || "Chưa có tên"}
                          </p>
                        </div>
                      </td>

                      {/* Công việc */}
                      <td
                        className="p-3"
                        onClick={() =>
                          navigate(`/recruiter/applications/${item.id}`)
                        }
                      >
                        <p className="text-slate-700 truncate">
                          {item.job?.title || "—"}
                        </p>
                      </td>

                      {/* Trạng thái */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            item.status === "accepted"
                              ? "bg-green-100 text-green-700"
                            : item.status === "rejected"
                              ? "bg-rose-100 text-rose-700"
                            : item.status === "interviewing"
                              ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700" // pending
                          }`}
                        >
                          {item.status === "accepted"
                            ? "Đã chấp nhận"
                            : item.status === "rejected"
                            ? "Đã từ chối"
                            : item.status === "interviewing"
                            ? "Đang phỏng vấn"
                            : "Đang chờ"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
