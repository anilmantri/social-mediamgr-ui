import { Loader2 } from "lucide-react";
import { cn, contentStatusConfig, publishStatusConfig } from "@/lib/utils";
import type { ContentStatus, PublishStatus } from "@/types";

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("w-5 h-5 animate-spin text-pink-500", className)} />;
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-6 h-6" />
    </div>
  );
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  const cfg = contentStatusConfig[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
      {cfg.label}
    </span>
  );
}

export function PublishBadge({ status }: { status: PublishStatus }) {
  const cfg = publishStatusConfig[status];
  return (
    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.color)}>
      {cfg.label}
    </span>
  );
}

export function EmptyState({ icon: Icon, title, desc, action }: {
  icon: React.ElementType; title: string; desc: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
      <div className="w-14 h-14 rounded-2xl ig-gradient flex items-center justify-center">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <p className="font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-sm text-gray-400 max-w-xs">{desc}</p>
      {action}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="card max-w-md w-full p-5 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <button onClick={onClose} className="btn-ghost p-1 text-gray-400 hover:text-gray-600">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
