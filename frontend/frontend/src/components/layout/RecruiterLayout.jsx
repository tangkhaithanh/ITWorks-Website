import { Outlet, NavLink } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { LogOut, FileText,BriefcaseBusiness } from "lucide-react";
import logo from "@/assets/images/logo.png";
import Button from "@/components/ui/Button";
import { logout } from "@/features/auth/authSlice";

export default function RecruiterLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* 🔹 Header */}
      <header className="bg-white shadow-sm h-16 flex items-center justify-between px-6 fixed top-0 left-0 right-0 z-50">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Logo" className="h-8 w-auto" />
          <span className="text-lg font-bold text-slate-700">
            ITworks for Business
          </span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="text-rose-600 border-rose-300 hover:bg-rose-50 hover:border-rose-400"
          onClick={handleLogout}
        >
          <LogOut className="w-5 h-5" />
          <span>Đăng xuất</span>
        </Button>
      </header>

      {/* 🔸 Main layout (Sidebar + Content) */}
      <div className="flex flex-1 pt-16">
        {/* Sidebar */}
        <aside className="w-72 bg-white border-r border-slate-200 shadow-sm h-[calc(100vh-4rem)] sticky top-16 flex flex-col">
          {/* User info */}
          <div className="flex items-center gap-3 p-4 border-b border-slate-200">
            <img
              src={user?.user?.avatar_url || "https://i.pravatar.cc/100"}
              alt={user?.user?.full_name}
              className="w-12 h-12 rounded-full object-cover border border-slate-200"
            />
            <div>
              <p className="font-semibold text-slate-800 text-sm">
                {user?.user?.full_name || "Nhà tuyển dụng"}
              </p>
              <p className="text-xs text-slate-500">{user?.email || "abc"}</p>
            </div>
          </div>

          {/* Sidebar menu */}
          <nav className="flex-1 p-4 space-y-2 text-slate-700">
            <NavLink
              to="/recruiter/cv"
              className={({ isActive }) =>
                `flex items-center gap-2 w-full px-5 py-2 rounded-xl transition-all font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-slate-100 text-slate-700"
                }`
              }
            >
              <FileText className="w-5 h-5 text-blue-600" />
              Quản lý CV
            </NavLink>

            <NavLink
            to="/recruiter/company"
            className={({ isActive }) =>
              `flex items-center gap-2 w-full px-5 py-2 rounded-xl transition-all font-medium ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "hover:bg-slate-100 text-slate-700"
              }`
            }
          >
            <FileText className="w-5 h-5 text-blue-600" />
            Quản lý công ty
          </NavLink>

          <NavLink
          to="/recruiter/jobs"
          className={({ isActive }) =>
            `flex items-center gap-2 w-full px-5 py-2 rounded-xl transition-all font-medium ${
              isActive
                ? "bg-blue-50 text-blue-700"
                : "hover:bg-slate-100 text-slate-700"
            }`
          }
        >
          <BriefcaseBusiness className="w-5 h-5 text-blue-600" />
          Quản lý tin tuyển dụng
        </NavLink>
          </nav>
        </aside>

        {/* Nội dung chính */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
