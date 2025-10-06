import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { User, Settings, LogOut, Crown, Mail, Calendar, ChevronRight } from "lucide-react";
import Button from "@/components/ui/Button";

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

  console.log("👉 user data:", user);

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar trigger with enhanced styling */}
      <button
        onClick={() => setOpen(!open)}
        className="relative group focus:outline-none focus:ring-2 focus:ring-blue-500/20 rounded-full transition-all duration-200"
      >
        <div className="relative">
          <img
            src={
              user?.user?.avatar_url ||
              "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
            }
            alt="User Avatar"
            className="w-10 h-10 rounded-full border-2 border-white shadow-lg object-cover transition-all duration-300 group-hover:shadow-xl group-hover:scale-105"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=User";
            }}
          />
          {/* Online status indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
          
          {/* Hover ring effect */}
          <div className="absolute inset-0 rounded-full ring-2 ring-blue-500/0 group-hover:ring-blue-500/30 transition-all duration-300"></div>
        </div>
      </button>

      {/* Enhanced Dropdown */}
      <div
        className={`absolute right-0 mt-4 w-80 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl ring-1 ring-slate-200/50 border border-white/20
                    transform transition-all duration-300 origin-top-right z-50 overflow-hidden
                    ${open ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 -translate-y-2 pointer-events-none"}`}
      >
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 pointer-events-none"></div>
        
        {/* User info section with enhanced design */}
        <div className="relative px-6 py-5 border-b border-slate-100/80">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img
                src={
                  user?.user?.avatar_url ||
                  "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                }
                alt="User Avatar"
                className="w-16 h-16 rounded-2xl border-2 border-white shadow-lg object-cover"
              />
              {/* Premium badge (if applicable) */}
            
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-slate-800 truncate">
                  {user?.user?.full_name || "User Name"}
                </h3>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Mail className="w-3 h-3" />
                  <span className="truncate">{user?.email || "user@example.com"}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>ID: {user?.user?.id || "000000"}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* User stats or badges */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100/50">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-800">12</div>
              <div className="text-xs text-slate-500">Ứng tuyển</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-800">5</div>
              <div className="text-xs text-slate-500">Đã lưu</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-800">98%</div>
              <div className="text-xs text-slate-500">Hồ sơ</div>
            </div>
          </div>
        </div>

        {/* Menu items with enhanced styling */}
        <div className="relative py-2">
          <Link
            to="/profile"
            className="group flex items-center justify-between px-6 py-3.5 text-slate-700 
                       hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 
                       hover:text-blue-700 transition-all duration-200"
            onClick={() => setOpen(false)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-blue-100/50 group-hover:bg-blue-200/70 transition-colors duration-200">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <span className="text-sm font-semibold">Hồ sơ cá nhân</span>
                <div className="text-xs text-slate-500">Quản lý thông tin của bạn</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors duration-200" />
          </Link>

          <Link
            to="/settings"
            className="group flex items-center justify-between px-6 py-3.5 text-slate-700 
                       hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 
                       hover:text-purple-700 transition-all duration-200"
            onClick={() => setOpen(false)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-100/50 group-hover:bg-purple-200/70 transition-colors duration-200">
                <Settings className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <span className="text-sm font-semibold">Cài đặt</span>
                <div className="text-xs text-slate-500">Tùy chỉnh tài khoản</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors duration-200" />
          </Link>

          {/* Additional menu items */}
          <Link
            to="/my-applications"
            className="group flex items-center justify-between px-6 py-3.5 text-slate-700 
                       hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 
                       hover:text-green-700 transition-all duration-200"
            onClick={() => setOpen(false)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-green-100/50 group-hover:bg-green-200/70 transition-colors duration-200">
                <Calendar className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <span className="text-sm font-semibold">Đơn ứng tuyển</span>
                <div className="text-xs text-slate-500">Theo dõi trạng thái</div>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-green-600 transition-colors duration-200" />
          </Link>
        </div>

        {/* Elegant divider */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-200 to-transparent h-px"></div>
          <div className="relative bg-white h-2"></div>
        </div>

        {/* Enhanced logout section */}
        <div className="relative px-6 py-4">
          <Button
            variant="outline"
            size="md"
            className="w-full flex items-center justify-center gap-3 
                       text-red-600 border-red-200/80 bg-red-50/30
                       hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 
                       hover:border-red-300 hover:shadow-lg
                       transition-all duration-300 transform hover:scale-[1.02]
                       rounded-2xl py-3 font-semibold"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            <div className="p-1.5 rounded-lg bg-red-100/80">
              <LogOut className="w-4 h-4" />
            </div>
            <span>Đăng xuất</span>
          </Button>
        </div>

        {/* Decorative bottom gradient */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-60"></div>
      </div>
    </div>
  );
};

export default UserAvatarMenu;
