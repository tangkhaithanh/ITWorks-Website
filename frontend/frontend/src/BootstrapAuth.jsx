import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import AuthAPI from "@/features/auth/AuthAPI";
import { setUser } from "@/features/auth/authSlice";

export default function BootstrapAuth({ children }) {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth); // 👈 lấy toàn bộ state auth

  useEffect(() => {
    (async () => {
      try {
        const me = await AuthAPI.me();
        dispatch(setUser(me.data.data));
      } catch {
        try {
          await AuthAPI.refresh();
          const me2 = await AuthAPI.me();
          dispatch(setUser(me2.data.data));
        } catch {
          dispatch(setUser(null));
        }
      }
    })();
  }, [dispatch]);


  return children || null;
}
