export type FormValues = Record<string, string>;

type BaseField = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  /** Share of the row the field occupies. Defaults to "third". */
  width?: "third" | "half" | "two-thirds" | "full";
  /** Exact width in columns of the 12-column grid; overrides `width`. */
  span?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Force the field onto a new row. */
  startRow?: boolean;
  /** Make the field required only when this returns true (e.g. depends on a checkbox). */
  requiredWhen?: (values: FormValues) => boolean;
  /** Extra check run after the required check; return an error message to fail. */
  validate?: (value: string, values: FormValues) => string | undefined;
};

export type TextField = BaseField & {
  type: "text" | "password" | "tel" | "email";
  maxLength?: number;
  /** Store and show the value in upper case. */
  uppercase?: boolean;
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
};

export type FormField = TextField | SelectField | CheckboxField;
