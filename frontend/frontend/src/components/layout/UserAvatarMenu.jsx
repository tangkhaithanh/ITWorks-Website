import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  User, 
  Settings, 
  LogOut, 
  FileText, 
  ChevronRight,
  Sparkles 
} from "lucide-react";

const UserAvatarMenu = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Menu items config để dễ quản lý và render
  const menuItems = [
    {
      to: "/profile",
      icon: User,
      label: "Hồ sơ của tôi",
      desc: "Quản lý thông tin cá nhân"
    },
    {
      to: "/my-applications",
      icon: FileText,
      label: "Quản lý đơn ứng tuyển",
      desc: "Theo dõi trạng thái đơn ứng tuyển"
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Cài đặt",
      desc: "Tùy chỉnh và cài đặt tài khoản"
    }
  ];

  return (
    <div className="relative" ref={menuRef}>
      {/* --- Trigger Avatar --- */}
      <button
        onClick={() => setOpen(!open)}
        className={`group relative outline-none transition-all duration-200 ${open ? 'scale-105' : ''}`}
      >
        <div className="relative">
          <img
            src={user?.user?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
            alt="User Avatar"
            className={`w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm transition-all duration-300 group-hover:shadow-md 
              ${open ? 'ring-2 ring-blue-500/20 ring-offset-2' : ''}`}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=User";
            }}
          />
          {/* Status Dot */}
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
        </div>
      </button>

      {/* --- Dropdown Content --- */}
      <div
        className={`
          absolute right-0 mt-3 w-72 
          bg-white rounded-2xl shadow-xl border border-slate-100 
          transform transition-all duration-200 origin-top-right z-50
          ${open 
            ? "scale-100 opacity-100 translate-y-0 visible" 
            : "scale-95 opacity-0 -translate-y-2 invisible"
          }
        `}
      >
        {/* 1. User Header Section */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <img
              src={user?.user?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
              alt="Avatar"
              className="w-12 h-12 rounded-full border border-white shadow-sm object-cover"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {user?.user?.full_name || "Người dùng"}
              </h4>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {user?.email || "user@example.com"}
              </p>
              
              {/* Badge ví dụ (Optional) */}
              <div className="flex items-center gap-1 mt-1.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-100">
                  <Sparkles size={10} />
                  Ứng viên
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Navigation Links */}
        <div className="p-2 space-y-1">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-2.5 rounded-xl group hover:bg-slate-50 transition-colors duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-100 text-slate-500 group-hover:text-blue-600 group-hover:border-blue-100 transition-colors shadow-sm">
                  <item.icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700 group-hover:text-slate-900">
                    {item.label}
                  </p>
                  <p className="text-[11px] text-slate-400 group-hover:text-slate-500">
                    {item.desc}
                  </p>
                </div>
              </div>
              <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>

        {/* 3. Footer / Logout */}
        <div className="p-2 mt-1 border-t border-slate-100">
          <button
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="w-full flex items-center gap-3 p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors duration-200 group"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 group-hover:bg-red-100 transition-colors">
              <LogOut size={16} />
            </div>
            <span className="text-sm font-medium">Đăng xuất</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserAvatarMenu;