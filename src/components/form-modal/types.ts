export type FormValues = Record<string, string>;

type BaseField = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
  /** Share of the 3-column row the field occupies. Defaults to "third". */
  width?: "third" | "half" | "two-thirds" | "full";
  /** Force the field onto a new row. */
  startRow?: boolean;
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

export type FormField = TextField | SelectField;
