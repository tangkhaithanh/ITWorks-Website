// src/features/auth/BootstrapAuth.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthAPI from "@/features/auth/AuthAPI";
import { setUser } from "@/features/auth/authSlice";

export default function BootstrapAuth({ children }) {
  const dispatch = useDispatch();
  const { initialized } = useSelector((state) => state.auth); // ✅ lấy flag từ Redux

  useEffect(() => {
    (async () => {
      try {
        // 🟢 Thử lấy thông tin đăng nhập hiện tại
        const me = await AuthAPI.me();
        dispatch(setUser(me.data.data));
      } catch {
        try {
          // 🟡 Nếu access token hết hạn, thử refresh
          await AuthAPI.refresh();
          const me2 = await AuthAPI.me();
          dispatch(setUser(me2.data.data));
        } catch {
          // 🔴 Nếu refresh cũng lỗi → user chưa đăng nhập
          dispatch(setUser(null));
        }
      }
    })();
  }, [dispatch]);

  // 🔸 Chưa load xong auth → chờ
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600">
        <span className="animate-pulse">Đang tải thông tin đăng nhập...</span>
      </div>
    );
  }

  // ✅ Khi đã check xong → render app (RouterProvider nằm trong children)
  return children;
}
