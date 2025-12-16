import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "./Header";
import Footer from "./Footer";

const MainLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();

  // 🛠️ Logic: Dùng Footer gọn cho các trang chức năng nội bộ (Dashboard, CV, Profile...)
  // Các trang Marketing (Home, Job List, Blog...) thì dùng Footer đầy đủ.
  const isFunctionalPage = [
    "/my-cv",
    "/profile",
    "/settings",
    "/change-password",
    "/dashboard"
  ].some(path => location.pathname.includes(path));

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50 text-slate-900">
      {/* Header cố định hoặc cuộn theo tùy logic của bạn */}
      <Header user={user} />

      {/* Thêm pb-12 (padding-bottom) để đảm bảo nội dung cuối cùng 
         không bao giờ bị dính sát sạt vào Footer 
      */}
      <main className="flex-1 w-full max-w-full pb-12">
        <Outlet />
      </main>

      {/* Truyền prop compact dựa trên trang hiện tại */}
      <Footer compact={isFunctionalPage} />
    </div>
  );
};

export default MainLayout;