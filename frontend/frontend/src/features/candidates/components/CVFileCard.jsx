import { Download, Calendar, FileText, Eye } from "lucide-react";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";
import { useSelector } from "react-redux";
import CandidateAPI from "../CandidateAPI";

const CVFileCard = ({ cv }) => {
  const { user } = useSelector((state) => state.auth);

  const handleDownload = async () => {
    if (!user) {
      window.location.href = "/login"; // cần login
      return;
    }
    if (!cv?.file_url) return;

    try {
      // 👉 Lấy tên file gốc từ URL Cloudinary
      const filename = cv.file_url.split("/").pop();
      const res = await CandidateAPI.viewCv(filename);

      // ✅ Tạo URL blob từ buffer PDF
      const blob = new Blob([res.data], { type: "application/pdf" });
      const blobUrl = window.URL.createObjectURL(blob);

      // 🔥 Mở tab mới để render file PDF
      window.open(blobUrl, "_blank");
    } catch (error) {
      console.error("❌ Lỗi khi tải CV:", error);
      alert("Không thể hiển thị file CV. Vui lòng thử lại.");
    }
  };

  return (
    <div className="group relative w-full sm:w-[260px] bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer">

      {/* 🟦 Phần 1: Khu vực hiển thị Thumbnail (Giả lập tờ giấy) */}
      <div
        className="h-40 bg-slate-50 flex items-center justify-center relative border-b border-slate-100"
        onClick={handleDownload} // Cho phép click vào vùng này để xem luôn
      >
        {/* Giả lập tờ giấy A4 */}
        <div className="w-20 h-28 bg-white border border-slate-200 shadow-md rounded-lg flex flex-col items-center justify-center relative transition-transform duration-300 group-hover:scale-105">
          {/* Góc gấp của giấy (trang trí) */}
          <div className="absolute top-0 right-0 w-6 h-6 bg-slate-100 rounded-bl-lg"></div>

          {/* Icon PDF */}
          <FileText className="text-red-500 mb-2" size={32} strokeWidth={1.5} />

          {/* Dòng kẻ giả lập văn bản */}
          <div className="w-12 h-1 bg-slate-200 rounded mb-1"></div>
          <div className="w-10 h-1 bg-slate-200 rounded mb-1"></div>
          <div className="w-8 h-1 bg-slate-200 rounded"></div>
        </div>

        {/* Badge PDF (Nhãn loại file) */}
        <div className="absolute top-3 right-3 bg-red-100 text-red-600 text-[10px] font-bold px-2 py-0.5 rounded-md border border-red-200">
          PDF
        </div>
      </div>

      {/* 🟦 Phần 2: Overlay Action (Nút xem) - Chỉ hiện khi hover */}
      <div className="absolute inset-x-0 top-0 h-40 flex items-center justify-center bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none group-hover:pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Tránh click nhầm vào card
            handleDownload();
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg px-5 py-2 rounded-full flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 font-medium text-sm"
        >
          <Eye size={16} /> Xem ngay
        </button>
      </div>

      {/* 🟦 Phần 3: Thông tin file */}
      <div className="p-4 bg-white">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Tên file */}
            <h4
              className="text-sm font-semibold text-slate-800 truncate"
              title={cv?.title || "Không có tên"}
            >
              {cv?.title || "CV chưa đặt tên"}
            </h4>

            {/* Ngày cập nhật */}
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <Calendar size={12} className="text-slate-400" />
              <span>
                {cv?.updated_at
                  ? format(new Date(cv.updated_at), "dd 'thg' MM, yyyy", { locale: vi })
                  : "Chưa cập nhật"}
              </span>
            </div>
          </div>

          {/* Nút download phụ (icon nhỏ bên cạnh) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDownload();
            }}
            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Tải xuống / Xem"
          >
            <Download size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CVFileCard;