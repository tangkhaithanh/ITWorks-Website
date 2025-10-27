import { useEffect, useRef, useState } from "react";
import { Upload } from "lucide-react";
import Swal from "sweetalert2";
import CvAPI from "../CvAPI";
import CVFileCard from "./CVFileCard";
import Button from "@/components/ui/Button";

const MyFileCvs = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
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

  // 🟢 Hàm xử lý khi chọn file upload
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // ✅ Kiểm tra định dạng PDF
    if (file.type !== "application/pdf") {
      Swal.fire({
        icon: "error",
        title: "Sai định dạng file",
        text: "Vui lòng chọn file PDF hợp lệ.",
        confirmButtonColor: "#2563eb",
      });
      e.target.value = ""; // reset input
      return;
    }

    try {
      Swal.fire({
        title: "Đang tải lên...",
        text: "Vui lòng chờ trong giây lát.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      // 📤 Gọi API upload file
      await CvAPI.uploadFile(file);

      Swal.fire({
        icon: "success",
        title: "Tải lên thành công!",
        text: "CV của bạn đã được tải lên hệ thống.",
        confirmButtonColor: "#16a34a",
      }).then(() => {
        fetchCvs(); // reload danh sách CV sau khi bấm OK
      });
    } catch (err) {
      console.error("❌ Lỗi khi upload CV:", err);
      Swal.fire({
        icon: "error",
        title: "Tải lên thất bại",
        text: err?.response?.data?.message || "Vui lòng thử lại sau.",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      e.target.value = ""; // reset input sau khi upload
    }
  };

  // 🟢 Khi click nút upload → kích hoạt input file
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* 🟦 Khung bao tổng thể */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        {/* 🔹 Header: Tiêu đề + nút tải lên */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            CV đã tải lên
          </h2>

          <Button
            variant="primary"
            size="sm"
            className="flex items-center gap-2"
            onClick={handleUploadClick}
          >
            <Upload size={18} />
            Tải CV lên
          </Button>

          {/* input ẩn để chọn file */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* 🔹 Nội dung chính */}
        {loading ? (
          <p className="text-gray-500 text-center py-10">
            Đang tải file CV...
          </p>
        ) : cvs.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-600 text-lg font-medium">
              Bạn chưa tải CV nào lên
            </p>
            <p className="text-sm text-gray-400 mt-1">
              Hãy nhấn nút “Tải CV lên” để bắt đầu.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-5">
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
