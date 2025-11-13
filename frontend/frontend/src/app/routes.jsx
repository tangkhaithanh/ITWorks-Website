import { createBrowserRouter } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import AuthLayout from "@/components/layout/AuthLayout";
import GuestRoute from "./GuestRoute";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/features/auth/pages/LoginPage";
import RegisterPage from "@/features/auth/pages/RegisterPage";
import VerifyEmailPage from "@/features/auth/pages/VerifyEmailPage";
import ResetPasswordPage from "@/features/auth/pages/ResetPasswordPage";
import JobSearchPage from "@/features/jobs/pages/JobSearchPage";
import JobDetailPage from "@/features/jobs/pages/JobDetailPage";
import MyCvPage from "@/features/candidates/pages/MyCvPage";
import CandidateInterviewsPage from "@/features/interviews/pages/CandidateInterviewsPage";
import ProtectedRoute from "./ProtectedRoute";
import RecruiterLayout from "@/components/layout/RecruiterLayout";
import CvManagementPage from "../features/applications/pages/CvManagementPage";
const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <HomePage /> },
      // ở đây có thể thêm các route public khác (jobs, companies…)
      { path: "jobs/search", element: <JobSearchPage /> },
      { path: "jobs/:id", element: <JobDetailPage /> },
      {
        path: "manage-cv",
        element: (
          <ProtectedRoute roles={["candidate"]}>
            <MyCvPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "interviews",
        element: (
          <ProtectedRoute roles={["candidate"]}>
            <CandidateInterviewsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: "login", element: <GuestRoute><LoginPage /></GuestRoute> },
      { path: "register", element: <RegisterPage /> },
      { path: "verify-email", element: <VerifyEmailPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },
  {
    path: "/recruiter",
    element: (
      <ProtectedRoute roles={["recruiter"]}>
        <RecruiterLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: "cv", element: <CvManagementPage /> },
    ],
  },
]);

export default router;
