"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { Loading03Icon } from "@hugeicons/core-free-icons";

interface ModalOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive";
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void | Promise<void>;
}

interface ModalContextType {
  show: (options: ModalOptions) => void;
  hide: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ModalOptions | null>(null);
  const [isConfirmLoading, setIsConfirmLoading] = useState(false);
  const [isCancelLoading, setIsCancelLoading] = useState(false);

  const show = useCallback((opts: ModalOptions) => {
    setOptions(opts);
    setIsOpen(true);
    setIsConfirmLoading(false);
    setIsCancelLoading(false);
  }, []);

  const hide = useCallback(() => {
    setIsOpen(false);
    // Don't clear options immediately to allow for exit animation
  }, []);

  const handleConfirm = async () => {
    if (!options?.onConfirm) {
      hide();
      return;
    }

    try {
      const result = options.onConfirm();
      if (result instanceof Promise) {
        setIsConfirmLoading(true);
        await result;
      }
      hide();
    } catch (error) {
      console.error("Modal confirm error:", error);
    } finally {
      setIsConfirmLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!options?.onCancel) {
      hide();
      return;
    }

    try {
      const result = options.onCancel();
      if (result instanceof Promise) {
        setIsCancelLoading(true);
        await result;
      }
      hide();
    } catch (error) {
      console.error("Modal cancel error:", error);
    } finally {
      setIsCancelLoading(false);
    }
  };

  return (
    <ModalContext.Provider value={{ show, hide }}>
      {children}
      <Dialog open={isOpen} onOpenChange={(open) => !open && !isConfirmLoading && !isCancelLoading && hide()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{options?.title}</DialogTitle>
            {options?.description && (
              <DialogDescription>{options.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isConfirmLoading || isCancelLoading}
            >
              {isCancelLoading && (
                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
              )}
              {options?.cancelText || "Cancel"}
            </Button>
            <Button
              variant={options?.variant || "default"}
              onClick={handleConfirm}
              disabled={isConfirmLoading || isCancelLoading}
            >
              {isConfirmLoading && (
                <HugeiconsIcon icon={Loading03Icon} className="h-4 w-4 animate-spin" />
              )}
              {options?.confirmText || "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModalContext.Provider>
  );
}

export function useModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal must be used within a ModalProvider");
  }
  return context;
}
