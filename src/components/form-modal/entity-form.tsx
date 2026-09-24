"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { FormField, FormValues } from "./types";

export type EntityFormActionsState = { submitting: boolean; error?: string };

type EntityFormProps = {
  fields: FormField[];
  /** Starting values (e.g. the record being edited); fields not listed use their defaults. */
  initialValues?: FormValues;
  /** Called with trimmed, validated values. Throw to keep the form open and show the error. */
  onSubmit: (values: FormValues) => void | Promise<void>;
  /** Called after onSubmit resolves. */
  onSuccess?: () => void;
  /** Classes for the scrolling field area (padding, spacing). */
  bodyClassName?: string;
  /** Renders the submit/cancel buttons; placed after the fields. */
  renderActions: (state: EntityFormActionsState) => ReactNode;
};

const spanClass = [
  "",
  "sm:col-span-1",
  "sm:col-span-2",
  "sm:col-span-3",
  "sm:col-span-4",
  "sm:col-span-5",
  "sm:col-span-6",
  "sm:col-span-7",
  "sm:col-span-8",
  "sm:col-span-9",
  "sm:col-span-10",
  "sm:col-span-11",
  "sm:col-span-12",
];

const widthSpan: Record<NonNullable<FormField["width"]>, number> = {
  third: 4,
  half: 6,
  "two-thirds": 8,
  full: 12,
};

const controlClass =
  "h-[31px] w-full border border-[#ced4da] bg-white px-2.5 text-[12.5px] font-semibold text-[#333] outline-none placeholder:font-normal placeholder:text-[#c4c4c4] focus:border-[#e6c45b] focus:bg-[#fde8a0] aria-invalid:border-red-500";

function defaultValues(fields: FormField[], initial?: FormValues): FormValues {
  return Object.fromEntries(
    fields.map((f) => [
      f.name,
      initial?.[f.name] ?? f.defaultValue ?? (f.type === "select" ? (f.options[0]?.value ?? "") : ""),
    ]),
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

/** Config-driven form: renders fields on a 12-column grid, validates, and reports submit errors. */
export function EntityForm({ fields, initialValues, onSubmit, onSuccess, bodyClassName, renderActions }: EntityFormProps) {
  const [values, setValues] = useState(() => defaultValues(fields, initialValues));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

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
    const form = event.currentTarget;
    const focusField = (name: string) => form.querySelector<HTMLElement>(`[name="${name}"]`)?.focus();
    setSubmitError(undefined);

    const trimmed = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, v.trim()]));
    const nextErrors = validateAll(fields, trimmed);
    setErrors(nextErrors);
    const firstInvalid = fields.find((f) => nextErrors[f.name]);
    if (firstInvalid) {
      focusField(firstInvalid.name);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(trimmed);
      onSuccess?.();
    } catch (error) {
      // Server-side field errors (e.g. ApiError.fields) go under their inputs; anything else is shown with the actions.
      const serverFields = (error as { fields?: Record<string, string> }).fields ?? {};
      const known = Object.fromEntries(Object.entries(serverFields).filter(([name]) => fields.some((f) => f.name === name)));
      setErrors(known);
      const firstServerInvalid = fields.find((f) => known[f.name]);
      if (firstServerInvalid) focusField(firstServerInvalid.name);
      setSubmitError(
        error instanceof TypeError
          ? "Could not reach the server. Please try again."
          : error instanceof Error
            ? error.message
            : "Something went wrong. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form noValidate onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className={cn("grid grid-cols-12 gap-x-[15px] gap-y-[18px]", bodyClassName)}>
        {fields.map((field) => {
          const id = `form-field-${field.name}`;
          const error = errors[field.name];
          return (
            <div
              key={field.name}
              className={cn(
                "col-span-12",
                spanClass[field.span ?? widthSpan[field.width ?? "third"]],
                field.startRow && "sm:col-start-1",
              )}
            >
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
      {renderActions({ submitting, error: submitError })}
    </form>
  );
}
