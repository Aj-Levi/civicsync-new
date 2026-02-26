import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useSessionStore } from "./store/sessionStore";

// Layouts
import KioskLayout from "./layouts/KioskLayout";
import AdminLayout from "./layouts/AdminLayout";

// Onboarding
import SplashScreen from "./pages/onboarding/SplashScreen";
import LanguageSelectionPage from "./pages/onboarding/LanguageSelectionPage";
import LoginPage from "./pages/onboarding/LoginPage";
import OTPPage from "./pages/onboarding/OTPPage";
import GuestAccessPage from "./pages/onboarding/GuestAccessPage";

// Citizen
import CitizenDashboard from "./pages/citizen/CitizenDashboard";
import PayBillsPage from "./pages/citizen/PayBillsPage";
import BillDetailPage from "./pages/citizen/BillDetailPage";
import PaymentSuccessPage from "./pages/citizen/PaymentSuccessPage";
import RegisterComplaintPage from "./pages/citizen/RegisterComplaintPage";
import ComplaintConfirmationPage from "./pages/citizen/ComplaintConfirmationPage";
import NewServiceRequestPage from "./pages/citizen/NewServiceRequestPage";
import TrackStatusPage from "./pages/citizen/TrackStatusPage";
import ComplaintMapPage from "./pages/citizen/ComplaintMapPage";
import HelpSupportPage from "./pages/citizen/HelpSupportPage";
import NotificationsPage from "./pages/citizen/NotificationsPage";
import ProfilePage from "./pages/citizen/ProfilePage";

// Admin
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminComplaintsPage from "./pages/admin/AdminComplaintsPage";
import AdminServiceRequestsPage from "./pages/admin/AdminServiceRequestsPage";
import AdminNotificationsPage from "./pages/admin/AdminNotificationsPage";
import AdminMapPage from "./pages/admin/AdminMapPage";

// Other
import NotFoundPage from "./pages/NotFoundPage";

// ── Route Guards ──────────────────────────────────────────────────────────────
function CitizenRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useSessionStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role === "admin") return <Navigate to="/admin" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, role } = useSessionStore();
  if (!isAuthenticated || role !== "admin")
    return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Onboarding ──────────────────────────── */}
        <Route path="/" element={<SplashScreen />} />
        <Route path="/language" element={<LanguageSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/otp" element={<OTPPage />} />
        <Route path="/guest" element={<GuestAccessPage />} />

        {/* ── Citizen (KioskLayout wraps all) ─────── */}
        <Route
          element={
            <CitizenRoute>
              <KioskLayout />
            </CitizenRoute>
          }
        >
          <Route path="/citizen" element={<CitizenDashboard />} />
          <Route path="/citizen/bills" element={<PayBillsPage />} />
          <Route path="/citizen/bills/:id" element={<BillDetailPage />} />
          <Route
            path="/citizen/bills/success"
            element={<PaymentSuccessPage />}
          />
          <Route
            path="/citizen/complaint/new"
            element={<RegisterComplaintPage />}
          />
          <Route
            path="/citizen/complaint/confirm"
            element={<ComplaintConfirmationPage />}
          />
          <Route
            path="/citizen/service/new"
            element={<NewServiceRequestPage />}
          />
          <Route path="/citizen/track" element={<TrackStatusPage />} />
          <Route path="/citizen/map" element={<ComplaintMapPage />} />
          <Route path="/citizen/help" element={<HelpSupportPage />} />
          <Route
            path="/citizen/notifications"
            element={<NotificationsPage />}
          />
          <Route path="/citizen/profile" element={<ProfilePage />} />
        </Route>

        {/* ── Admin (AdminLayout wraps all) ─────────── */}
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/complaints" element={<AdminComplaintsPage />} />
          <Route
            path="/admin/requests"
            element={<AdminServiceRequestsPage />}
          />
          <Route
            path="/admin/notifications"
            element={<AdminNotificationsPage />}
          />
          <Route path="/admin/map" element={<AdminMapPage />} />
        </Route>

        {/* ── 404 ─────────────────────────────────── */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
