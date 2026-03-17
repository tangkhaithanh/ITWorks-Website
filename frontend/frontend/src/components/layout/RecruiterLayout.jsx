import { useState, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import useNotificationsRealtime from "@/features/notifications/useNotificationsRealtime.js";
import CompanyPlanAPI from "../../features/companies/CompanyPlanAPI";
import {
  LogOut,
  FileText,
  BriefcaseBusiness,
  LayoutDashboard,
  Building2,
  Menu,
  X,
  ChevronRight,
  Receipt,
    Bell,
} from "lucide-react";
import logo from "@/assets/images/logo.png";
import { Gauge } from "lucide-react";
import { Crown } from "lucide-react";
import { logout } from "@/features/auth/authSlice";

// ============================
// 📌 Menu cấu hình
// ============================
const NAV_ITEMS = [
  { path: "/recruiter/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { path: "/recruiter/cv", label: "Quản lý CV", icon: FileText },
  { path: "/recruiter/jobs", label: "Tin tuyển dụng", icon: BriefcaseBusiness },
  { path: "/recruiter/company", label: "Hồ sơ công ty", icon: Building2 },
  { path: "/recruiter/orders", label: "Quản lý đơn hàng", icon: Receipt },
  { path: "/recruiter/upgrade-plan", label: "Nâng cấp gói", icon: Crown },
];

export default function RecruiterLayout() {
  useNotificationsRealtime();
  const unread = useSelector((state) => state.notifications?.unread || 0);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  // ============================
  // 🚀 FIX redirect /recruiter → /recruiter/dashboard
  //     — KHÔNG return Navigate để tránh lỗi hooks
  // ============================

  useEffect(() => {
    const fetchCompanyPlan = async () => {
      try {
        const res = await CompanyPlanAPI.getCurrentSummary();
        setCurrentPlan(res?.data?.data || null);
      } catch (err) {
        console.error("Failed to load company plan", err);
        setCurrentPlan(null);
      }
    };

    fetchCompanyPlan();
  }, []);
  // Đóng sidebar khi đổi route
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location]);

  const handleLogout = () => {
    dispatch(logout());
  };


  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-900">

      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-white border-r border-slate-200 shadow-xl lg:shadow-none
          transition-transform duration-300 ease-in-out
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        <div className="flex flex-col h-full">

          {/* Logo */}
          <div className="h-16 flex items-center px-6 border-b border-slate-100 bg-white">
            <img src={logo} alt="Logo" className="h-8 w-auto mr-3" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent">
              ITworks Business
            </span>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="ml-auto lg:hidden text-slate-500 hover:text-slate-800"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User Profile */}
          <div className="p-4 mx-3 mt-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <img
              src={user?.user?.avatar_url || `https://ui-avatars.com/api/?name=${user?.user?.full_name}&background=random`}
              alt="User"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-slate-800 truncate">
                {user?.user?.full_name || "Nhà tuyển dụng"}
              </p>
              <p className="text-xs text-slate-500 truncate">
                {user?.email}
              </p>
              <p className="mt-1 text-[11px] font-semibold truncate text-blue-600">
                {currentPlan?.current_plan?.name || "Free"}
              </p>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  group flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                  ${isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <item.icon
                        className={`w-5 h-5 ${isActive
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-slate-600"
                          }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
                  </>
                )}
              </NavLink>
            ))}
            {currentPlan && (
              <NavLink
                to="/recruiter/usage"
                className={({ isActive }) => `
        group flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
        ${isActive
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }
      `}
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Gauge
                        className={`w-5 h-5 ${isActive
                          ? "text-blue-600"
                          : "text-slate-400 group-hover:text-slate-600"
                          }`}
                      />
                      <span>Giới hạn sử dụng</span>
                    </div>

                    {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
                  </>
                )}
              </NavLink>
            )}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-100">
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full gap-2 px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all duration-200 group"
            >
              <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main layout */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header (Không hiển thị tên trang) */}
        <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/80 backdrop-blur-md border-b border-slate-200/60 lg:bg-white lg:border-b-0 lg:shadow-sm">

          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-md"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Không hiển thị tiêu đề */}
          <div />

          {/* Right */}
          <div className="flex items-center gap-3">
            {/* 🔔 Bell + badge */}
            <div className="relative">
              <button
                  type="button"
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-600"
                  title="Thông báo"
              >
                <Bell className="w-5 h-5" />
              </button>

              {unread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[11px] font-bold flex items-center justify-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </div>

            <div className="hidden sm:block text-sm text-slate-500">
              {new Date().toLocaleDateString("vi-VN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="mx-auto max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </main>
      </div>

    </div>
  );
}
