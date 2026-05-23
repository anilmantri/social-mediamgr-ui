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

const queryClient = new QueryClient({
  defaultOptions: {
    queries:   { retry: 1, staleTime: 30_000 },
    mutations: { retry: 0 },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/"          element={<DashboardPage />} />
            <Route path="/content"   element={<ContentPage />} />
            <Route path="/content/:id" element={<ContentDetailPage />} />
            <Route path="/calendar"  element={<CalendarPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/settings"  element={<SettingsPage />} />
            <Route path="*"          element={<Navigate to="/" replace />} />
          </Route>
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
