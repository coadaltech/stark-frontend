"use client";

import { useEffect, useState, type ReactNode } from "react";

type LoadState<T> = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: T };

/**
 * Loads one record (fresh on every mount, and again whenever `load` changes) and renders `children`
 * with it; shows loading / error + Retry. `load` should be stable (e.g. defined per id).
 */
export function DetailLoader<T>({
  load,
  errorMessage,
  children,
}: {
  load: () => Promise<T>;
  /** Shown when the request fails with a non-network error that has no message. */
  errorMessage: string;
  children: (data: T) => ReactNode;
}) {
  const [state, setState] = useState<LoadState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    load().then(
      (data) => !cancelled && setState({ status: "ready", data }),
      (error: unknown) =>
        !cancelled &&
        setState({
          status: "error",
          message:
            error instanceof TypeError
              ? "Could not reach the server."
              : error instanceof Error
                ? error.message
                : errorMessage,
        }),
    );
    return () => {
      cancelled = true;
    };
  }, [load, attempt, errorMessage]);

  if (state.status === "loading") {
    return <p className="py-10 text-center text-[13px] text-[#999]">Loading…</p>;
  }

  if (state.status === "error") {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-[13px]">
        <p role="alert" className="font-semibold text-red-600">
          {state.message}
        </p>
        <button
          type="button"
          onClick={() => {
            setState({ status: "loading" });
            setAttempt((n) => n + 1);
          }}
          className="h-[31px] rounded-[2px] bg-brand-action px-4 font-bold text-white hover:bg-brand-nav-active"
        >
          Retry
        </button>
      </div>
    );
  }

  return <>{children(state.data)}</>;
}
