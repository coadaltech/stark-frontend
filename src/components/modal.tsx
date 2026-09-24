"use client";

import type { ReactNode } from "react";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";
import { Dialog, DialogOverlay, DialogPortal } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type ModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
};

/** App-styled dialog: teal title bar, dark backdrop, optional footer. */
export function Modal({ open, onOpenChange, title, children, footer, className }: ModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogPortal>
        <DialogOverlay className="bg-black/75 supports-backdrop-filter:backdrop-blur-none" />
        <DialogPrimitive.Popup
          className={cn(
            "fixed top-[82px] left-1/2 z-50 flex max-h-[calc(100dvh-100px)] w-[756px] max-w-[calc(100%-2rem)] -translate-x-1/2 flex-col overflow-hidden rounded-[5px] bg-white shadow-xl outline-none duration-150 data-open:animate-in data-open:fade-in-0 data-open:slide-in-from-top-4 data-closed:animate-out data-closed:fade-out-0",
            className,
          )}
        >
          <div className="flex h-[52px] shrink-0 items-center justify-between bg-brand px-[15px] text-white">
            <DialogPrimitive.Title className="text-base font-bold">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close
              aria-label="Close"
              className="grid size-6 place-items-center rounded-sm opacity-80 outline-none hover:opacity-100 focus-visible:ring-2 focus-visible:ring-white/60"
            >
              <XIcon className="size-4" strokeWidth={3} />
            </DialogPrimitive.Close>
          </div>
          {children}
          {footer && (
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e5e5e5] px-[15px] py-4">
              {footer}
            </div>
          )}
        </DialogPrimitive.Popup>
      </DialogPortal>
    </Dialog>
  );
}
