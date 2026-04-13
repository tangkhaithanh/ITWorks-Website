import { useEffect, useRef, useState } from "react";
import { Upload, CloudUpload, FileText, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import CvAPI from "../CvAPI";
import CVFileCard from "./CVFileCard";
import Button from "@/components/ui/Button";

const MyFileCvs = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [pendingSearchableId, setPendingSearchableId] = useState(null);
  const fileInputRef = useRef(null);

  const fetchCvs = async () => {
    setLoading(true);
    try {
      const res = await CvAPI.getMyFileCvs();
      setCvs(res?.data?.data?.items || []);
    } catch (err) {
      console.error("Loi khi load file CV:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
  }, []);

  const handleFileUpload = async (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      Swal.fire({
        icon: "error",
        title: "Dinh dang khong ho tro",
        text: "He thong chi chap nhan file PDF.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "File qua lon",
        text: "Vui long chon file nho hon 5MB.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      Swal.fire({
        title: "Dang tai len...",
        html: `Dang xu ly file <b>${file.name}</b>`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await CvAPI.uploadFile(file);

      Swal.fire({
        icon: "success",
        title: "Thanh cong!",
        text: "CV cua ban da duoc tai len.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        fetchCvs();
      });
    } catch (err) {
      console.error("Loi upload:", err);
      Swal.fire({
        icon: "error",
        title: "Co loi xay ra",
        text: err?.response?.data?.message || "Vui long thu lai sau.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteCv = async (cv) => {
    const result = await Swal.fire({
      title: "Xoa CV nay?",
      text: "Ban se khong the hoan tac thao tac nay.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Xoa",
      cancelButtonText: "Huy",
    });

    if (!result.isConfirmed) return;

    try {
      setPendingDeleteId(cv.id);
      await CvAPI.delete(cv.id);
      setCvs((prev) => prev.filter((item) => item.id !== cv.id));

      Swal.fire({
        icon: "success",
        title: "Da xoa CV",
        text: "CV da duoc xoa khoi danh sach.",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Loi khi xoa CV:", err);
      Swal.fire({
        icon: "error",
        title: "Xoa CV that bai",
        text: err?.response?.data?.message || "Vui long thu lai sau.",
      });
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleToggleSearchable = async (cvId, nextValue) => {
    try {
      setPendingSearchableId(cvId);
      await CvAPI.updateSearchableStatus(cvId, nextValue);

      setCvs((prev) =>
        prev.map((item) => ({
          ...item,
          is_searchable: nextValue ? item.id === cvId : item.id === cvId ? false : item.is_searchable,
        })),
      );
    } catch (err) {
      console.error("Loi khi cap nhat searchable:", err);
      Swal.fire({
        icon: "error",
        title: "Cap nhat that bai",
        text: err?.response?.data?.message || "Khong the cap nhat trang thai searchable.",
      });
    } finally {
      setPendingSearchableId(null);
    }
  };

  const handleFileChange = (e) => {
    handleFileUpload(e.target.files[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileUpload(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> Quản lý CV và hồ sơ
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Lưu trữ và quản lý các phiên bản CV của bạn.
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          className="hidden md:flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Upload size={18} /> Tai CV Moi
        </Button>
      </div>

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 mb-8 group
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 scale-[1.01]"
              : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
          }
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex flex-col items-center justify-center gap-3">
          <div
            className={`p-4 rounded-full ${
              isDragging
                ? "bg-blue-100 text-blue-600"
                : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"
            } transition-colors`}
          >
            <CloudUpload size={32} />
          </div>
          <div>
            <p className="text-gray-700 font-medium text-lg">
              {isDragging
                ? "Tha file vao day ngay!"
                : "Nhấn để tải lên hoặc thả file vào đây"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Chi ho tro dinh dang PDF (Toi da 5MB)
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 min-h-[300px]">
        <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-3">
          Danh sach CV da luu ({cvs.length})
        </h3>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((item) => (
              <div key={item} className="border border-gray-200 rounded-xl p-4 animate-pulse">
                <div className="h-40 bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : cvs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <FileText size={48} className="text-gray-300" />
            </div>
            <h4 className="text-gray-900 font-medium text-lg">Chua co CV nao</h4>
            <p className="text-gray-500 max-w-sm mt-2 mb-6">
              Ban chua tai len bat ky CV nao. Hay tai len ngay de bat dau ung tuyen cong viec mo uoc.
            </p>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              Tai CV len ngay
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cvs.map((cv) => (
              <CVFileCard
                key={cv.id}
                cv={cv}
                onDelete={handleDeleteCv}
                onToggleSearchable={handleToggleSearchable}
                isDeleting={pendingDeleteId === cv.id}
                isTogglingSearchable={pendingSearchableId === cv.id}
              />
            ))}
          </div>
        )}

        {(pendingDeleteId || pendingSearchableId) && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin" />
            Dang cap nhat danh sach CV...
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFileCvs;
