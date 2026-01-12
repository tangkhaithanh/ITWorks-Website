import { useState } from "react";
import { Link } from "react-router-dom";
import Button from "@/components/ui/Button";
import logo from "@/assets/images/logo.png";
import { Bell, MessageCircle } from "lucide-react";
import UserAvatarMenu from "@/components/layout/UserAvatarMenu";
import { logout } from "@/features/auth/authSlice";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
const Header = ({ user }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    dispatch(logout());
    navigate("/");
  };

  return (
    <header className="w-full bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-50">
      <div className="w-full px-4 h-16 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-8">
          <Link to="/" className="flex items-center">
            <img
              src={logo}
              alt="Logo"
              className="w-32 h-32 object-contain"
            />
          </Link>
          <nav className="flex items-center space-x-6 text-slate-700 font-medium">
            <Link to="/jobs/search" className="px-3 py-1.5 rounded-lg hover:text-blue-600">Việc làm</Link>
            <Link to="/companies" className="px-3 py-1.5 rounded-lg hover:text-blue-600">Công ty</Link>
            <Link to="/manage-cv" className="px-3 py-1.5 rounded-lg hover:text-blue-600">CV của tôi</Link>
          </nav>
        </div>

        {/* Right section */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <button className="relative p-2 rounded-full hover:bg-slate-100">
                <Bell className="w-6 h-6 text-slate-600 hover:text-blue-600" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">3</span>
              </button>
              <button className="relative p-2 rounded-full hover:bg-slate-100">
                <MessageCircle className="w-6 h-6 text-slate-600 hover:text-blue-600" />
              </button>
              <UserAvatarMenu user={user} onLogout={handleLogout} />
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/register"><Button variant="green" size="sm">Đăng ký</Button></Link>
              <Link to="/login"><Button variant="primary" size="sm">Đăng nhập</Button></Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;