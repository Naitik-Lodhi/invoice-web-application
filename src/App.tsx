// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import PublicLayout from "./layout/PublicLayout";
import LoginPage from "./pages/auth/LoginPage";
import SignupPage from "./pages/auth/SignupPage";
import AppLayout from "./layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import ItemListPage from "./pages/ItemListPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { SnackbarProvider } from "notistack";
import InvoicesPage from "./pages/InvoicesPage";
import { useEffect } from "react";
import { toast } from "./utils/toast";
import ErrorBoundaryTestPage from "./test/ErrorBoundaryTests";
import ErrorBoundary from "./error/ErrorBoundary";

const App = () => {
  const { company } = useAuth();

  // In App.tsx or index.tsx
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error("Uncaught error:", event.error);
      toast.error("An unexpected error occurred");
      event.preventDefault();
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error("Unhandled promise rejection:", event.reason);
      toast.error("An unexpected error occurred");
      event.preventDefault();
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, []);

  // ✅ Auto-save logo on app load
  useEffect(() => {
    const saveLogo = async () => {
      if (!company?.companyID || !company?.thumbnailUrl) return;

      const logoKey = `company_logo_base64_${company.companyID}`;
      const existingLogo = localStorage.getItem(logoKey);

      if (existingLogo) {
        console.log("✅ Logo already saved");
        return;
      }

      console.log("🔄 Saving logo to localStorage...");

      try {
        const response = await fetch(company.thumbnailUrl, {
          mode: "cors",
          credentials: "omit",
        });

        if (!response.ok) {
          console.warn("⚠️ Logo fetch failed");
          return;
        }

        const blob = await response.blob();

        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          localStorage.setItem(logoKey, base64);
          console.log(`✅ Logo saved: ${(base64.length / 1024).toFixed(2)} KB`);
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("❌ Logo save failed:", error);
      }
    };

    saveLogo();
  }, [company?.companyID, company?.thumbnailUrl]);
  return (
    <SnackbarProvider maxSnack={3}>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
          </Route>

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="itemlist" element={<ItemListPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
          </Route>

          <Route
            path="/test-error-boundaries"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  {" "}
                  {/* ✅ Wrap with ErrorBoundary */}
                  <ErrorBoundaryTestPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes to dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
};

export default App;
