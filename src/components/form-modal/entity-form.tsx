"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { isInputField, type FormField, type FormSlotState, type FormValues, type InputField } from "./types";

export type EntityFormActionsState = FormSlotState;

/**
 * The form's fields — or a function of the current values, for forms whose fields depend on each other
 * (options filtered by another field, fields shown only for some choices, disabled checkboxes, …).
 */
export type FormFields = FormField[] | ((values: FormValues) => FormField[]);

type EntityFormProps = {
  fields: FormFields;
  /** Starting values (e.g. the record being edited); fields not listed use their defaults. */
  initialValues?: FormValues;
  /** Called with trimmed, validated values. Throw to keep the form open and show the error. */
  onSubmit: (values: FormValues) => void | Promise<void>;
  /** Called after onSubmit resolves. */
  onSuccess?: () => void;
  /** Classes for the scrolling field area (padding, spacing). */
  bodyClassName?: string;
  /** Renders the submit/cancel buttons after the fields (omit when a slot field holds them). */
  renderActions?: (state: EntityFormActionsState) => ReactNode;
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

const widthSpan: Record<NonNullable<InputField["width"]>, number> = {
  third: 4,
  half: 6,
  "two-thirds": 8,
  full: 12,
};

const controlClass =
  "h-[31px] w-full border border-[#ced4da] bg-white px-2.5 text-[12.5px] font-semibold text-[#333] outline-none placeholder:font-normal placeholder:text-[#c4c4c4] focus:border-[#e6c45b] focus:bg-[#fde8a0] aria-invalid:border-red-500 disabled:cursor-not-allowed disabled:bg-[#f2f2f2] disabled:text-[#666]";

const emptyValue = (f: InputField) =>
  f.defaultValue ?? (f.type === "select" ? (f.options[0]?.value ?? "") : f.type === "checkbox" ? (f.uncheckedValue ?? "0") : "");

function defaultValues(fields: InputField[], initial?: FormValues): FormValues {
  return Object.fromEntries(fields.map((f) => [f.name, initial?.[f.name] ?? emptyValue(f)]));
}

/**
 * The value a field shows and submits: fields that appeared later start empty, and a select whose value
 * is no longer one of its options falls back to its first option (e.g. a "Select …" placeholder).
 */
function fieldValue(field: InputField, values: FormValues) {
  const value = values[field.name] ?? emptyValue(field);
  if (field.type === "select" && !field.options.some((o) => o.value === value)) return field.options[0]?.value ?? "";
  return value;
}

function validateAll(fields: InputField[], values: FormValues) {
  const errors: Record<string, string> = {};
  for (const field of fields) {
    if (field.disabled) continue;
    const value = values[field.name]?.trim() ?? "";
    const required = field.required || field.requiredWhen?.(values);
    if (required && !value) errors[field.name] = `${field.label} is required`;
    else if (value && field.validate) {
      const message = field.validate(value, values);
      if (message) errors[field.name] = message;
    }
  }
  return errors;
}

/** Config-driven form: renders fields on a 12-column grid, validates, and reports submit errors. */
export function EntityForm({ fields: fieldsProp, initialValues, onSubmit, onSuccess, bodyClassName, renderActions }: EntityFormProps) {
  const resolveFields = (values: FormValues) => (typeof fieldsProp === "function" ? fieldsProp(values) : fieldsProp);
  const [values, setValues] = useState(() =>
    defaultValues(resolveFields(initialValues ?? {}).filter(isInputField), initialValues),
  );
  const fields = resolveFields(values);
  const inputFields = fields.filter(isInputField);
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

    // Passwords are sent exactly as typed; everything else is trimmed.
    const passwordFields = new Set(inputFields.filter((f) => f.type === "password").map((f) => f.name));
    const shown = { ...values, ...Object.fromEntries(inputFields.map((f) => [f.name, fieldValue(f, values)])) };
    const trimmed = Object.fromEntries(Object.entries(shown).map(([k, v]) => [k, passwordFields.has(k) ? v : v.trim()]));
    const nextErrors = validateAll(inputFields, trimmed);
    setErrors(nextErrors);
    const firstInvalid = inputFields.find((f) => nextErrors[f.name]);
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
      const known = Object.fromEntries(
        Object.entries(serverFields).filter(([name]) => inputFields.some((f) => f.name === name)),
      );
      setErrors(known);
      const firstServerInvalid = inputFields.find((f) => known[f.name]);
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
          const placement = (f: Exclude<FormField, { type: "heading" }>) =>
            cn("col-span-12", spanClass[f.span ?? widthSpan[f.width ?? "third"]], f.startRow && "sm:col-start-1");
          if (field.type === "heading") {
            return (
              <h3 key={field.name} className="col-span-12 -mb-2 text-[13.5px] font-bold text-[#333]">
                {field.label}
              </h3>
            );
          }
          if (field.type === "slot") {
            return (
              <div key={field.name} className={placement(field)}>
                {field.render({ submitting, error: submitError })}
              </div>
            );
          }
          const id = `form-field-${field.name}`;
          const error = errors[field.name];
          return (
            <div key={field.name} className={placement(field)}>
              {field.type !== "checkbox" && (
                <label htmlFor={id} className="mb-2 block text-[13px] text-[#333]">
                  {field.label}
                  {field.required && <span className="sr-only"> (required)</span>}
                </label>
              )}
              {field.type === "checkbox" ? (
                <label
                  htmlFor={id}
                  className={cn(
                    "flex min-h-[31px] items-center text-[13px] text-[#333]",
                    field.compact ? "gap-[18px]" : "gap-[62px]",
                    field.alignWithInputs && "mt-[29px]",
                  )}
                >
                  <input
                    id={id}
                    name={field.name}
                    type="checkbox"
                    checked={fieldValue(field, values) === (field.checkedValue ?? "1")}
                    disabled={field.disabled}
                    onChange={(e) =>
                      setValue(field.name, e.target.checked ? (field.checkedValue ?? "1") : (field.uncheckedValue ?? "0"))
                    }
                    aria-invalid={!!error || undefined}
                    className="size-6 shrink-0 cursor-pointer accent-[#1a73e8] disabled:cursor-not-allowed disabled:opacity-50"
                  />
                  {field.label}
                </label>
              ) : field.type === "textarea" ? (
                <textarea
                  id={id}
                  name={field.name}
                  value={fieldValue(field, values)}
                  disabled={field.disabled}
                  rows={field.rows ?? 4}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  spellCheck={false}
                  onChange={(e) => setValue(field.name, e.target.value)}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className={cn(controlClass, "h-auto resize-y py-2 leading-[1.6] break-all")}
                />
              ) : field.type === "select" ? (
                <select
                  id={id}
                  name={field.name}
                  value={fieldValue(field, values)}
                  disabled={field.disabled}
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
                  value={fieldValue(field, values)}
                  disabled={field.disabled}
                  maxLength={field.maxLength}
                  placeholder={field.placeholder}
                  inputMode={field.inputMode ?? (field.type === "tel" ? "numeric" : undefined)}
                  autoComplete={field.type === "password" ? "new-password" : "off"}
                  onChange={(e) => setValue(field.name, field.uppercase ? e.target.value.toUpperCase() : e.target.value)}
                  aria-invalid={!!error || undefined}
                  aria-describedby={error ? `${id}-error` : undefined}
                  className={cn(controlClass, field.align === "right" && "text-right")}
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
      {renderActions?.({ submitting, error: submitError })}
    </form>
  );
}
