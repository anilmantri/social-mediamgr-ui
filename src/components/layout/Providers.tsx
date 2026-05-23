"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [qc] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 30_000 },
      mutations: { retry: 0 },
    },
  }));
  return (
    <QueryClientProvider client={qc}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "!bg-white dark:!bg-gray-900 !text-gray-900 dark:!text-gray-100 !border !border-gray-200 dark:!border-gray-800 !shadow-card !rounded-xl !text-sm",
          duration: 4000,
          success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
          error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </QueryClientProvider>
  );
}
