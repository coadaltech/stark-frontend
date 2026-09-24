"use client";

import { Modal } from "@/components/modal";
import { EntityForm } from "./entity-form";
import type { FormField, FormValues } from "./types";

type FormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FormField[];
  initialValues?: FormValues;
  /** Called with the validated values; the modal closes once it resolves. */
  onSubmit: (values: FormValues) => void | Promise<void>;
  submitLabel?: string;
  closeLabel?: string;
};

/** Generic "add/edit entity" modal driven by a field config. */
export function FormModal({
  open,
  onOpenChange,
  title,
  fields,
  initialValues,
  onSubmit,
  submitLabel = "Save",
  closeLabel = "Close",
}: FormModalProps) {
  const close = () => onOpenChange(false);
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      {/* Mounted only while open, so every open starts from a fresh form. */}
      <EntityForm
        fields={fields}
        initialValues={initialValues}
        onSubmit={onSubmit}
        onSuccess={close}
        bodyClassName="overflow-y-auto px-[15px] pt-4 pb-8"
        renderActions={({ submitting, error }) => (
          <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e5e5e5] px-[15px] py-4">
            {error && (
              <p role="alert" className="mr-auto text-[12.5px] font-semibold text-red-600">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="h-[33px] rounded-[3px] bg-brand-action px-3 text-[13px] font-bold text-white hover:bg-brand-nav-active disabled:opacity-60"
            >
              {submitLabel}
            </button>
            <button
              type="button"
              onClick={close}
              className="h-[33px] rounded-[3px] px-3 text-[13px] font-semibold text-[#333] hover:bg-black/5"
            >
              {closeLabel}
            </button>
          </div>
        )}
      />
    </Modal>
  );
}
