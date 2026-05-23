import { NavLink } from "react-router-dom";
import { LayoutDashboard, Sparkles, Calendar, BarChart2, Settings, Instagram, ChevronLeft, ChevronRight } from "lucide-react";
import { useAppStore } from "@/stores/app";
import { useHealth } from "@/hooks";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/",          label: "Overview",       icon: LayoutDashboard },
  { to: "/content",   label: "Content Studio", icon: Sparkles },
  { to: "/calendar",  label: "Calendar",       icon: Calendar },
  { to: "/analytics", label: "Analytics",      icon: BarChart2 },
  { to: "/settings",  label: "Settings",       icon: Settings },
];

export function Sidebar() {
  const { sidebarOpen, toggleSidebar, workspaceName } = useAppStore();
  const { data: health } = useHealth();

  return (
    <aside className={cn(
      "relative flex flex-col h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex-shrink-0",
      sidebarOpen ? "w-56" : "w-16"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="w-8 h-8 rounded-lg ig-gradient flex items-center justify-center flex-shrink-0">
          <Instagram className="w-4 h-4 text-white" />
        </div>
        {sidebarOpen && (
          <span className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">{workspaceName}</span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-pink-600")} />
                {sidebarOpen && <span className="truncate">{label}</span>}
                {isActive && sidebarOpen && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-500" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Service health */}
      {sidebarOpen && (
        <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", health?.status === "ok" ? "bg-emerald-500 animate-pulse-slow" : "bg-rose-500")} />
            <span className="text-xs text-gray-500">{health?.status === "ok" ? "Service online" : "Service offline"}</span>
          </div>
          {health?.version && <p className="text-xs text-gray-400 mt-0.5">v{health.version}</p>}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors z-10"
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3 text-gray-500" /> : <ChevronRight className="w-3 h-3 text-gray-500" />}
      </button>
    </aside>
  );
}
