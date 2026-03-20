"use client";

import { useState, useCallback, useRef } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";

interface ConfirmOptions {
  title: string;
  description?: string;
  variant?: "destructive" | "default";
  confirmText?: string;
}

export function useConfirm() {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    setState(options);
    setIsOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open && resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  const handleConfirm = () => {
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
    setIsOpen(false);
    setState(null);
  };

  const Dialog = state ? (
    <ConfirmDialog
      open={isOpen}
      onOpenChange={handleOpenChange}
      title={state.title}
      description={state.description}
      variant={state.variant}
      confirmText={state.confirmText}
      onConfirm={handleConfirm}
    />
  ) : null;

  return { confirm, Dialog };
}
