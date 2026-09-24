"use client";

import { useState, type FormEvent } from "react";
import { Modal } from "@/components/modal";
import { cn } from "@/lib/utils";
import type { FormField, FormValues } from "./types";

type FormModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FormField[];
  /** Called with the validated values; the modal closes once it resolves. */
  onSubmit: (values: FormValues) => void | Promise<void>;
  submitLabel?: string;
  closeLabel?: string;
};

const widthClass: Record<NonNullable<FormField["width"]>, string> = {
  third: "col-span-6 sm:col-span-2",
  half: "col-span-6 sm:col-span-3",
  "two-thirds": "col-span-6 sm:col-span-4",
  full: "col-span-6",
};

const controlClass =
  "h-[31px] w-full border border-[#ced4da] bg-white px-2.5 text-[12.5px] font-semibold text-[#333] outline-none placeholder:font-normal placeholder:text-[#c4c4c4] focus:border-[#e6c45b] focus:bg-[#fde8a0] aria-invalid:border-red-500";

function initialValues(fields: FormField[]): FormValues {
  return Object.fromEntries(
    fields.map((f) => [f.name, f.defaultValue ?? (f.type === "select" ? (f.options[0]?.value ?? "") : "")]),
  );
}

function validateAll(fields: FormField[], values: FormValues) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    const value = values[field.name]?.trim() ?? "";
    if (field.required && !value) errors[field.name] = `${field.label} is required`;
    else if (value && field.validate) {
      const message = field.validate(value, values);
      if (message) errors[field.name] = message;
    }
  }
  return errors;
}

/** Generic "add/edit entity" modal driven by a field config. */
export function FormModal({ open, onOpenChange, title, ...rest }: FormModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      {/* Mounted only while open, so every open starts from a fresh form. */}
      <FormModalBody onClose={() => onOpenChange(false)} {...rest} />
    </Modal>
  );
}

function FormModalBody({
  fields,
  onSubmit,
  onClose,
  submitLabel = "Save",
  closeLabel = "Close",
}: Omit<FormModalProps, "open" | "onOpenChange" | "title"> & { onClose: () => void }) {
  const [values, setValues] = useState(() => initialValues(fields));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const setValue = (name: string, value: string) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
    const nextErrors = validateAll(fields, trimmed);
    setErrors(nextErrors);
    const firstInvalid = fields.find((f) => nextErrors[f.name]);
    if (firstInvalid) {
      event.currentTarget.querySelector<HTMLElement>(`[name="${firstInvalid.name}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="grid grid-cols-6 gap-x-[15px] gap-y-[18px] overflow-y-auto px-[15px] pt-4 pb-8">
        {fields.map((field) => {
          const id = `form-field-${field.name}`;
          const error = errors[field.name];
          return (
            <div key={field.name} className={cn(widthClass[field.width ?? "third"], field.startRow && "sm:col-start-1")}>
              <label htmlFor={id} className="mb-2 block text-[13px] text-[#333]">
                {field.label}
                {field.required && <span className="sr-only"> (required)</span>}
              </label>
              {field.type === "select" ? (
                <select
                  id={id}
                  name={field.name}
                  value={values[field.name]}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  aria-invalid={!!error || undefined}
                  className={cn(controlClass, "h-[28px] px-1.5")}
                >
                  {field.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={id}
                  name={field.name}
                  type={field.type}
                  value={values[field.name]}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  inputMode={field.type === "tel" ? "numeric" : undefined}
                  autoComplete={field.type === "password" ? "new-password" : "off"}
                  onChange={(e) => setValue(field.name, field.uppercase ? e.target.value.toUpperCase() : e.target.value)}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className={controlClass}
                />
              )}
              {error && (
                <p id={`${id}-error`} className="mt-1 text-[11.5px] text-red-600">
                  {error}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#e5e5e5] px-[15px] py-4">
        <button
          type="submit"
          disabled={submitting}
          className="h-[33px] rounded-[3px] bg-brand-action px-3 text-[13px] font-bold text-white hover:bg-brand-nav-active disabled:opacity-60"
        >
          {submitLabel}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="h-[33px] rounded-[3px] px-3 text-[13px] font-semibold text-[#333] hover:bg-black/5"
        >
          {closeLabel}
        </button>
      </div>
    </form>
  );
}
