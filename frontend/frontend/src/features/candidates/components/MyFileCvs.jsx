import { useEffect, useRef, useState } from "react";
import { Upload, CloudUpload, FileText, Loader2, X } from "lucide-react";
import Swal from "sweetalert2";
import CvAPI from "../CvAPI";
import CVFileCard from "./CVFileCard";
import Button from "@/components/ui/Button";

const MyFileCvs = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false); // State xử lý kéo thả
  const fileInputRef = useRef(null);

  // 🟢 Hàm load danh sách CV
  const fetchCvs = async () => {
    setLoading(true);
    try {
      const res = await CvAPI.getMyFileCvs();
      setCvs(res?.data?.data?.items || []);
    } catch (err) {
      console.error("❌ Lỗi khi load file CV:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
  }, []);

  // 🟢 Xử lý logic Upload chung
  const handleFileUpload = async (file) => {
    if (!file) return;

    // ✅ Kiểm tra định dạng PDF
    if (file.type !== "application/pdf") {
      Swal.fire({
        icon: "error",
        title: "Định dạng không hỗ trợ",
        text: "Hệ thống chỉ chấp nhận file PDF.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }

    // ✅ Kiểm tra dung lượng (Ví dụ: giới hạn 5MB)
    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: "warning",
        title: "File quá lớn",
        text: "Vui lòng chọn file nhỏ hơn 5MB.",
        confirmButtonColor: "#f59e0b",
      });
      return;
    }

    try {
      Swal.fire({
        title: "Đang tải lên...",
        html: `Đang xử lý file <b>${file.name}</b>`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      await CvAPI.uploadFile(file);

      Swal.fire({
        icon: "success",
        title: "Thành công!",
        text: "CV của bạn đã được tải lên.",
        timer: 1500,
        showConfirmButton: false,
      }).then(() => {
        fetchCvs();
      });
    } catch (err) {
      console.error("❌ Lỗi upload:", err);
      Swal.fire({
        icon: "error",
        title: "Có lỗi xảy ra",
        text: err?.response?.data?.message || "Vui lòng thử lại sau.",
      });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 🖱️ Event: Chọn file từ Input
  const handleFileChange = (e) => {
    handleFileUpload(e.target.files[0]);
  };

  // 🖱️ Event: Kéo thả file
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
      {/* 🟦 Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="text-blue-600" /> Quản lý CV & Hồ sơ
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Lưu trữ và quản lý các phiên bản CV của bạn để ứng tuyển nhanh chóng.
          </p>
        </div>

        {/* Nút upload nhỏ cho mobile hoặc action phụ */}
        <Button
          variant="primary"
          onClick={() => fileInputRef.current?.click()}
          className="hidden md:flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Upload size={18} /> Tải CV Mới
        </Button>
      </div>

      {/* 🟦 Upload Zone (Drag & Drop) */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 mb-8 group
          ${isDragging
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
          <div className={`p-4 rounded-full ${isDragging ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-500 group-hover:bg-blue-50 group-hover:text-blue-500"} transition-colors`}>
            <CloudUpload size={32} />
          </div>
          <div>
            <p className="text-gray-700 font-medium text-lg">
              {isDragging ? "Thả file vào đây ngay!" : "Nhấn để tải lên hoặc kéo thả file vào đây"}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Chỉ hỗ trợ định dạng PDF (Tối đa 5MB)
            </p>
          </div>
        </div>
      </div>

      {/* 🟦 Danh sách File */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 min-h-[300px]">
        <h3 className="text-lg font-semibold text-gray-800 mb-5 border-b pb-3">
          Danh sách CV đã lưu ({cvs.length})
        </h3>

        {loading ? (
          // 🦴 Skeleton Loading UI
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
          // 📭 Empty State
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <FileText size={48} className="text-gray-300" />
            </div>
            <h4 className="text-gray-900 font-medium text-lg">Chưa có CV nào</h4>
            <p className="text-gray-500 max-w-sm mt-2 mb-6">
              Bạn chưa tải lên bất kỳ CV nào. Hãy tải lên ngay để bắt đầu ứng tuyển công việc mơ ước.
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
            >
              Tải CV lên ngay
            </Button>
          </div>
        ) : (
          // 📄 Grid List Layout
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cvs.map((cv) => (
              <CVFileCard key={cv.id} cv={cv} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFileCvs;