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
import ProtectedRoute from "./protectedRoute";
import RecruiterLayout from "@/components/layout/RecruiterLayout";
import CvManagementPage from "../features/applications/pages/CvManagementPage";
import ApplicationDetailsPage from "../features/applications/pages/ApplicationDetailsPage";
import CompanyManagementPage from "../features/companies/pages/CompanyManagementPage";
import CreateCompanyPage from "../features/companies/pages/CreateCompanyPage";
import ManageJobPage from "../features/jobs/pages/ManageJobPage";
import JobDetailForHRPage from "../features/jobs/pages/JobDetailForHRPage";
import CreateJobPage from "../features/jobs/pages/CreateJobPage";
import JobDashboardForHRPage from "../features/jobs/pages/JobDashboardForHRPage";
import CandidateProfilePage from "../features/candidates/pages/CandidateProfilePage";
import MyApplicationsPage from "../features/applications/pages/MyApplicationsPage";
import MyApplicationDetailPage from "../features/applications/pages/MyApplicationDetailPage";
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
        path: "profile",
        element: (
          <ProtectedRoute roles={["candidate"]}>
            <CandidateProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-applications",
        element: (
          <ProtectedRoute roles={["candidate"]}>
            <MyApplicationsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: "my-applications/:id",
        element: (
          <ProtectedRoute roles={["candidate"]}>
            <MyApplicationDetailPage />
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
      { path: "applications/:id", element: <ApplicationDetailsPage /> },
      { path: "company", element: <CompanyManagementPage /> },
      { path: "company/create", element: <CreateCompanyPage /> },
      { path: "company/:id/edit", element: <CreateCompanyPage /> },
      { path: "jobs", element: <ManageJobPage /> },
      { path: "jobs/:id", element: <JobDetailForHRPage /> },
      { path: "jobs/create", element: <CreateJobPage /> },
      { path: "jobs/:id/edit", element: <CreateJobPage /> },
      { path: "jobs/:id/dashboard", element: <JobDashboardForHRPage /> }
    ],
  },
]);
export default router;