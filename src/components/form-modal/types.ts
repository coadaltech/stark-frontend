import type { ReactNode } from "react";

export type FormValues = Record<string, string>;

/** Where an entry sits on the form's 12-column grid. */
type GridPlacement = {
  /** Share of the row the entry occupies. Defaults to "third". */
  width?: "third" | "half" | "two-thirds" | "full";
  /** Exact width in columns of the 12-column grid; overrides `width`. */
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Force the entry onto a new row. */
  startRow?: boolean;
};

type BaseField = GridPlacement & {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  /** Make the field required only when this returns true (e.g. depends on a checkbox). */
  requiredWhen?: (values: FormValues) => boolean;
  /** Extra check run after the required check; return an error message to fail. */
  validate?: (value: string, values: FormValues) => string | undefined;
};

export type TextField = BaseField & {
  /** "date" renders the browser date picker; its value is "YYYY-MM-DD" (or "" when empty). */
  type: "text" | "password" | "tel" | "email" | "date";
  maxLength?: number;
  /** Store and show the value in upper case. */
  uppercase?: boolean;
  /** Numeric keypad on mobile (the value is still a string). */
  inputMode?: "numeric";
  align?: "left" | "right";
};

export type SelectField = BaseField & {
  type: "select";
  options: { label: string; value: string }[];
};

export type CheckboxField = BaseField & {
  type: "checkbox";
  /** Stored value when ticked / unticked. Defaults to "1" / "0". */
  checkedValue?: string;
  uncheckedValue?: string;
  /** Put the label right next to the box instead of the wide legacy gap. */
  compact?: boolean;
};

/** An editable value of the form. */
export type TextareaField = BaseField & {
  type: "textarea";
  rows?: number;
  maxLength?: number;
};

export type InputField = TextField | SelectField | CheckboxField | TextareaField;

/** Full-width section title; not a value. */
export type HeadingField = { type: "heading"; name: string; label: string };

export type FormSlotState = { submitting: boolean; error?: string };

/** Custom content placed on the grid (e.g. a Save button mid-form); not a value. */
export type SlotField = GridPlacement & {
  type: "slot";
  name: string;
  render: (state: FormSlotState) => ReactNode;
};

export type FormField = InputField | HeadingField | SlotField;

export const isInputField = (field: FormField): field is InputField =>
  field.type !== "heading" && field.type !== "slot";
