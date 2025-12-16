import { useEffect, useState } from "react";
import CvAPI from "../CvAPI";
import Button from "@/components/ui/Button";
import {
  FileText,
  Calendar,
  LayoutTemplate,
  Edit,
  Eye,
  Trash2,
  Plus,
  MoreHorizontal
} from "lucide-react";
import { format } from "date-fns";
import vi from "date-fns/locale/vi";
import Swal from "sweetalert2";

const MyOnlineCvs = () => {
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🟢 Hàm load data
  const fetchCvs = async () => {
    setLoading(true);
    try {
      const res = await CvAPI.getMyOnlineCvs();
      setCvs(res.data.data.items);
    } catch (err) {
      console.error("❌ Lỗi khi load CV:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCvs();
  }, []);

  // 🟢 Xử lý xóa (Mockup)
  const handleDelete = (id) => {
    Swal.fire({
      title: "Xóa CV này?",
      text: "Hành động này không thể hoàn tác!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy"
    }).then((result) => {
      if (result.isConfirmed) {
        // await CvAPI.delete(id);
        Swal.fire("Đã xóa!", "CV đã được xóa khỏi danh sách.", "success");
        // Reload list...
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 🟦 Header: Tiêu đề + Nút tạo mới */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <LayoutTemplate className="text-indigo-600" /> CV Online của tôi
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Quản lý các bản CV kỹ thuật số bạn đã tạo trên hệ thống.
          </p>
        </div>
        <Button variant="primary" className="shadow-lg shadow-indigo-200 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
          <Plus size={18} /> Tạo CV Mới
        </Button>
      </div>

      {/* 🟦 Content Grid */}
      {loading ? (
        // 🦴 Skeleton Loading
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 animate-pulse">
              <div className="h-32 bg-slate-100 rounded-xl w-full"></div>
              <div className="h-4 bg-slate-100 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : cvs.length === 0 ? (
        // 📭 Empty State
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl border border-dashed border-slate-300">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-4">
            <LayoutTemplate size={32} />
          </div>
          <h3 className="text-lg font-semibold text-slate-800">Bạn chưa có CV Online nào</h3>
          <p className="text-slate-500 text-sm mt-2 mb-6 max-w-xs text-center">
            Hãy chọn một mẫu thiết kế đẹp mắt và bắt đầu tạo hồ sơ chuyên nghiệp ngay.
          </p>
          <Button variant="outline" className="border-indigo-200 text-indigo-600 hover:bg-indigo-50">
            Bắt đầu ngay
          </Button>
        </div>
      ) : (
        // 📄 Danh sách CV Online
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
            >
              {/* 🖼️ Card Header: Thumbnail hoặc Gradient Placeholder */}
              <div className="h-36 bg-gradient-to-br from-indigo-500 to-purple-600 relative flex items-center justify-center overflow-hidden">
                {/* Trang trí nền */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>

                {/* Icon đại diện */}
                <div className="relative z-10 bg-white/20 backdrop-blur-sm p-3 rounded-xl border border-white/30 text-white shadow-lg">
                  <FileText size={32} />
                </div>

                {/* Badge trạng thái (Ví dụ: Public/Draft) */}
                <div className="absolute top-3 right-3 bg-black/30 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-md border border-white/10">
                  ONLINE
                </div>
              </div>

              {/* 📝 Card Body: Thông tin */}
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-slate-800 text-lg truncate pr-2" title={cv.title}>
                    {cv.title}
                  </h3>
                  {/* Menu ba chấm (nếu cần mở rộng) */}
                  <button className="text-slate-400 hover:text-slate-600">
                    <MoreHorizontal size={18} />
                  </button>
                </div>

                {/* Template Tag */}
                {cv.template && (
                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                      <LayoutTemplate size={12} />
                      {cv.template.name}
                    </span>
                  </div>
                )}

                {/* Ngày cập nhật */}
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center text-xs text-slate-500 gap-1.5">
                  <Calendar size={14} className="text-slate-400" />
                  <span>
                    Cập nhật: {format(new Date(cv.created_at), "dd 'thg' MM, yyyy", { locale: vi })}
                  </span>
                </div>
              </div>

              {/* ⚡ Action Bar (Hiện khi hover hoặc luôn hiện tùy design) */}
              <div className="bg-slate-50 p-3 px-5 flex items-center justify-between gap-3 border-t border-slate-100">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-white border-slate-200 hover:border-indigo-300 hover:text-indigo-600"
                  onClick={() => console.log("View", cv.id)}
                >
                  <Eye size={16} className="mr-2" /> Xem
                </Button>

                <Button
                  size="sm"
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200"
                  onClick={() => console.log("Edit", cv.id)}
                >
                  <Edit size={16} className="mr-2" /> Sửa
                </Button>

                <button
                  className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  onClick={() => handleDelete(cv.id)}
                  title="Xóa CV"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOnlineCvs;