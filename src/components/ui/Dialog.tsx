"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

type DialogProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
};

export function Dialog({ open, onClose, title, className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={title ? titleId : undefined}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-border-subtle bg-surface p-0 shadow-[var(--shadow-popover)] backdrop:bg-black/40",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border-subtle p-4">
        <h2 id={titleId} className="text-base font-semibold">
          {title}
        </h2>
        <button
          onClick={onClose}
          aria-label="Close"
          className="focus-ring rounded-full p-1.5 text-zinc-500 hover:bg-surface-muted"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </dialog>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  loading,
  danger,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
  danger?: boolean;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <p className="text-sm text-zinc-600">{description}</p>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
