import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useHealth } from "@/hooks";

function TestingBanner() {
  const { data } = useHealth();
  if (!data?.testing_mode) return null;
  return (
    <div className="bg-amber-500 text-white text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center gap-2">
      <span>⚠️ TESTING MODE — All plan gates and credit limits are disabled</span>
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 dark:bg-gray-950">
      <TestingBanner />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
