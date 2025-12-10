import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CompanyAPI from "@/features/companies/CompanyAPI";
import CompanyProfileView from "@/features/companies/components/CompanyProfileView";
import Button from "@/components/ui/Button";
import { Eye, EyeOff } from "lucide-react";
import Swal from "sweetalert2";
export default function CompanyManagementPage() {
  const [loading, setLoading] = useState(true);
  const [company, setCompany] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  const fetchCompany = async () => {
    setLoading(true);
    try {
      const res = await CompanyAPI.getMyCompany();
      setCompany(res.data?.data || null);
    } catch (error) {
      console.error("Failed to fetch company", error);
      setCompany(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompany();
  }, []);

  const handleEdit = () => {
    if (company?.id) {
      navigate(`/recruiter/company/${company.id}/edit`);
    }
  };

  const handleCreate = () => {
    navigate("/recruiter/company/create");
  };

  const handleHide = async (companyId) => {
    const result = await Swal.fire({
      title: "Ẩn công ty?",
      text: "Công ty sẽ bị ẩn và không hiển thị với ứng viên.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ẩn ngay",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#dc2626",
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await CompanyAPI.hide(companyId);

      Swal.fire({
        title: "Đã ẩn công ty",
        text: "Công ty của bạn hiện đã bị ẩn.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchCompany(); // refresh trạng thái
    } catch (error) {
      Swal.fire({
        title: "Thao tác thất bại",
        text: error?.response?.data?.message || "Không thể ẩn công ty",
        icon: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };


  const handleUnhide = async (companyId) => {
    const result = await Swal.fire({
      title: "Hiển thị công ty?",
      text: "Công ty sẽ được hiển thị lại cho ứng viên.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Hiển thị",
      cancelButtonText: "Hủy",
      confirmButtonColor: "#2563eb",
    });

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await CompanyAPI.unhide(companyId);

      Swal.fire({
        title: "Đã hiển thị",
        text: "Công ty đã được hiển thị trở lại.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      fetchCompany(); // refresh trạng thái
    } catch (error) {
      Swal.fire({
        title: "Thao tác thất bại",
        text: error?.response?.data?.message || "Không thể hiển thị công ty",
        icon: "error",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ================================
  // ⭐ Render action cho Recruiter
  // ================================
  const renderActions = (c) => {
    if (!c) return null;

    const status = (c.status || "").toLowerCase();

    return (
      <div className="flex items-center gap-3">
        {/* Ẩn company */}
        {status === "approved" && (
          <Button
            variant="outline"
            disabled={actionLoading}
            onClick={() => handleHide(c.id)}
            className="gap-2 border-slate-300 text-slate-700"
          >
            <EyeOff className="w-4 h-4" />
            Ẩn công ty
          </Button>
        )}

        {/* Hiện company */}
        {status === "hidden" && (
          <Button
            variant="outline"
            disabled={actionLoading}
            onClick={() => handleUnhide(c.id)}
            className="gap-2 border-slate-300 text-slate-700"
          >
            <Eye className="w-4 h-4" />
            Hiển thị công ty
          </Button>
        )}
      </div>
    );
  };

  return (
    <CompanyProfileView
      company={company}
      loading={loading}
      onEdit={handleEdit}
      onCreate={handleCreate}
      isAdmin={false}              // recruiter: false
      renderActions={renderActions} // ⭐ thêm dòng này
    />
  );
}
