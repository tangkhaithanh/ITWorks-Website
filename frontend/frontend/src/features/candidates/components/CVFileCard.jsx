import { Download, Calendar } from "lucide-react";
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
      // 👉 Lấy tên file gốc từ URL Cloudinary (vd: https://.../cvs/mycv.pdf)
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
    <div className="relative group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition p-5 w-full sm:w-[260px] flex flex-col items-center">
      {/* Thumbnail xanh dương */}
      <div className="w-28 h-28 flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300 relative">
        <div className="absolute top-3 left-4 w-10 h-4 bg-blue-400 rounded-t-md"></div>
        <div className="w-16 h-12 bg-blue-500 rounded-md shadow-sm"></div>
        <span className="absolute bottom-3 text-white text-sm font-semibold">CV</span>
      </div>

      {/* Overlay khi hover */}
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition">
        <button
          onClick={handleDownload}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <Download size={18} />
          Xem CV
        </button>
      </div>

      {/* Thông tin file */}
      <div className="mt-4 text-center">
        <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">
          {cv?.title || "Không rõ tên file"}
        </p>
        <p className="text-xs text-gray-500 mt-1 flex items-center justify-center gap-1">
          <Calendar size={14} />
          Cập nhật{" "}
          {cv?.updated_at
            ? format(new Date(cv.updated_at), "dd-MM-yyyy HH:mm", { locale: vi })
            : "Không rõ"}
        </p>
      </div>
    </div>
  );
};

export default CVFileCard;
