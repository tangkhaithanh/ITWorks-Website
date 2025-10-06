import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children, roles }) => {
  const { user, initialized } = useSelector((state) => state.auth);

  if (!initialized) {
    // đang check auth → render spinner hoặc null
    return <div>Loading...</div>;
  }

  if (!user) {
    // chưa login → redirect
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user.role)) {
    // có login nhưng sai role → redirect
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
