"use client";

import { useEffect, useState, type ReactNode } from "react";
import { getOrganization } from "@/lib/organizations";
import type { OrganizationDetail } from "@/types/organization";

type LoadState = { status: "loading" } | { status: "error"; message: string } | { status: "ready"; data: OrganizationDetail };

/** Loads one organization (fresh on every mount) and renders `children` with it; shows loading / error + Retry. */
export function OrganizationDetailLoader({
  organizationId,
  children,
}: {
  organizationId: number;
  children: (organization: OrganizationDetail) => ReactNode;
}) {
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    getOrganization(organizationId).then(
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
                : "Could not load the organization.",
        }),
    );
    return () => {
      cancelled = true;
    };
  }, [organizationId, attempt]);

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
