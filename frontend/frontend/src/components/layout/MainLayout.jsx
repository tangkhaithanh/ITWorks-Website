import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "./Header";

const MainLayout = () => {
  const user = useSelector((state) => state.auth.user);

  return (
      <div className="flex flex-col min-h-screen">
        <Header user={user} />
        <main className="flex-1 bg-gray-50">
          <Outlet />
        </main>
      </div>
  );
};

export default MainLayout;
