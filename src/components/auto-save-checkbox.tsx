"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/utils";

type Status = { kind: "idle" } | { kind: "saving" } | { kind: "saved" } | { kind: "error"; message: string };

type AutoSaveCheckboxProps = {
  label: string;
  defaultChecked: boolean;
  /** Persists the new state; throw to revert the box and show the error. */
  onSave: (checked: boolean) => Promise<void>;
  className?: string;
};

/** Checkbox that saves as soon as it is toggled (no Save button). Disabled while a save is in flight. */
export function AutoSaveCheckbox({ label, defaultChecked, onSave, className }: AutoSaveCheckboxProps) {
  const id = useId();
  const [checked, setChecked] = useState(defaultChecked);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function toggle(next: boolean) {
    setChecked(next);
    setStatus({ kind: "saving" });
    try {
      await onSave(next);
      setStatus({ kind: "saved" });
    } catch (error) {
      setChecked(!next);
      setStatus({
        kind: "error",
        message:
          error instanceof TypeError
            ? "Could not reach the server."
            : error instanceof Error
              ? error.message
              : "Could not save.",
      });
    }
  }

  return (
    <div className={className}>
      <label htmlFor={id} className="flex min-h-[31px] items-center gap-[18px] text-[13px] text-[#333]">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={status.kind === "saving"}
          onChange={(e) => toggle(e.target.checked)}
          aria-describedby={`${id}-status`}
          className="size-6 shrink-0 cursor-pointer accent-[#1a73e8] disabled:cursor-wait"
        />
        {label}
      </label>
      <p
        id={`${id}-status`}
        role={status.kind === "error" ? "alert" : "status"}
        className={cn("min-h-4 pl-[42px] text-[11.5px]", status.kind === "error" ? "text-red-600" : "text-[#888]")}
      >
        {status.kind === "saving" ? "Saving…" : status.kind === "saved" ? "Saved" : status.kind === "error" ? status.message : ""}
      </p>
    </div>
  );
}
