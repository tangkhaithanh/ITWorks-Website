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
import CompanyDashboard from "../features/companies/pages/CompanyDashBoard";
import AdminLayout from "@/components/layout/AdminLayout";
import ManageAccountPage from "../features/admin/pages/ManageAccountPage";
import ManageCompanyForAdmin from "../features/companies/pages/ManageCompanyForAdmin";
import AdminCompanyDetailPage from "../features/companies/pages/AdminCompanyDetailPage";
import ManagePlanPage from "../features/admin/pages/ManagePlanPage";
import UpgradePlanPage from "../pages/UpgradePlanPage";
import PaymentResultPage from "../pages/PaymentResultPage";
import UsagePage from "../features/companies/pages/UsagePage";
import ManageOrderPage from "../features/companies/pages/ManageOrderPage";
import AdminDashboardPage from "../features/admin/pages/AdminDashboardPage";
import CompanySearchPage from "@/features/companies/pages/CompanySearchPage.jsx";
import CompanyProfilePage from "@/features/companies/pages/CompanyProfilePage.jsx";
import { Navigate } from "react-router-dom";
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
      {
        path: "companies",
        element: <CompanySearchPage/>,
      },
      {
        path: "companies/:id",
        element: <CompanyProfilePage/>,
      }
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
      { index: true, element: <Navigate to="dashboard" replace /> },
      { path: "dashboard", element: <CompanyDashboard /> },
      { path: "cv", element: <CvManagementPage /> },
      { path: "applications/:id", element: <ApplicationDetailsPage /> },
      { path: "company", element: <CompanyManagementPage /> },
      { path: "company/create", element: <CreateCompanyPage /> },
      { path: "company/:id/edit", element: <CreateCompanyPage /> },
      { path: "jobs", element: <ManageJobPage /> },
      { path: "jobs/:id", element: <JobDetailForHRPage /> },
      { path: "jobs/create", element: <CreateJobPage /> },
      { path: "jobs/:id/edit", element: <CreateJobPage /> },
      { path: "jobs/:id/dashboard", element: <JobDashboardForHRPage /> },
      { path: "upgrade-plan", element: <UpgradePlanPage /> },
      { path: "payment-result", element: <PaymentResultPage /> },
      { path: "usage", element: <UsagePage /> },
      { path: "orders", element: <ManageOrderPage /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute roles={["admin"]}>
        <AdminLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true, // 👈 TRANG MẶC ĐỊNH /admin
        element: <Navigate to="dashboard" replace />,
      },
      { path: "dashboard", element: <AdminDashboardPage /> },
      { path: "accounts", element: <ManageAccountPage /> },
      { path: "companies", element: <ManageCompanyForAdmin /> },
      { path: "companies/:id", element: <AdminCompanyDetailPage /> },
      { path: "plans", element: <ManagePlanPage /> }
    ],
  },
]);
export default router;