// src/features/auth/components/LoginForm.jsx (hoặc file bạn đang dùng)
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../authSlice";
import Button from "@/components/ui/Button";
import TextInput from "@/components/ui/TextInput";
import { Link, useNavigate } from "react-router-dom";

const LoginForm = () => {
  const dispatch = useDispatch();
  const { loading, error, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Điều hướng khi login xong
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case "candidate":
          navigate("/");
          break;
        case "recruiter":
          navigate("/recruiter/dashboard");
          break;
        case "admin":
          navigate("/admin/dashboard");
          break;
        default:
          navigate("/");
      }
    }
  }, [user, navigate]);

  // Clear lỗi khi người dùng gõ lại
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearError()), 0);
      return () => clearTimeout(t);
    }
  }, [email, password]); // khi input đổi, clear error

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md max-w-md w-full">
      <h2 className="text-2xl font-bold text-center">Đăng nhập</h2>

      <TextInput
        label="Email"
        type="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (error) dispatch(clearError());
        }}
        required
      />

      <TextInput
        label="Mật khẩu"
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          if (error) dispatch(clearError());
        }}
        required
      />

      {error?.message && (
        <p className="text-red-500 text-sm">{error.message}</p>
      )}

      <Button type="submit" variant="primary" disabled={loading} className="w-full">
        {loading ? "Đang đăng nhập..." : "Đăng nhập"}
      </Button>

      <p className="text-center text-sm text-gray-600">
        Chưa có tài khoản?{" "}
        <Link to="/register" className="text-indigo-600 hover:underline">
          Đăng ký ngay
        </Link>
      </p>

      <p className="text-center text-sm text-gray-600">
        <Link to="/verify-email" className="text-indigo-600 hover:underline">
          Quên mật khẩu?
        </Link>
      </p>
    </form>
  );
};

export default LoginForm;
