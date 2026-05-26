import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage }    from "@/pages/Dashboard";
import { ContentPage }      from "@/pages/Content";
import { ContentDetailPage } from "@/pages/ContentDetail";
import { CalendarPage }     from "@/pages/Calendar";
import { AnalyticsPage }    from "@/pages/Analytics";
import { SettingsPage }     from "@/pages/Settings";
import { BillingPage }      from "@/pages/Billing";
import { LoginPage }        from "@/pages/auth/Login";
import { SignupPage }       from "@/pages/auth/Signup";
import {
  AuthCallbackPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "@/pages/auth/AuthPages";
import { useAuthStore } from "@/stores/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries:   { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <Navigate to="/" replace /> : <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/signup"          element={<PublicRoute><SignupPage /></PublicRoute>} />
          <Route path="/auth/callback"   element={<AuthCallbackPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* Protected app routes */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/"              element={<DashboardPage />} />
            <Route path="/content"       element={<ContentPage />} />
            <Route path="/content/:id"   element={<ContentDetailPage />} />
            <Route path="/calendar"      element={<CalendarPage />} />
            <Route path="/analytics"     element={<AnalyticsPage />} />
            <Route path="/settings"      element={<SettingsPage />} />
            <Route path="/billing"       element={<BillingPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "!bg-white !text-gray-900 !border !border-gray-200 !shadow-card !rounded-xl !text-sm",
          duration: 4000,
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
}
