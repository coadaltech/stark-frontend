"use client";

import { useCallback, type ReactNode } from "react";
import { DetailLoader } from "@/components/detail-loader";
import { getOrganization } from "@/lib/organizations";
import type { OrganizationDetail } from "@/types/organization";

/** Loads one organization (fresh on every mount) and renders `children` with it; shows loading / error + Retry. */
export function OrganizationDetailLoader({
  organizationId,
  children,
}: {
  organizationId: number;
  children: (organization: OrganizationDetail) => ReactNode;
}) {
  const load = useCallback(() => getOrganization(organizationId), [organizationId]);
  return (
    <DetailLoader load={load} errorMessage="Could not load the organization.">
      {children}
    </DetailLoader>
  );
}
