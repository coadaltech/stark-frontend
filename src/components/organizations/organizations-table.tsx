"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FormModal } from "@/components/form-modal/form-modal";
import type { FormValues } from "@/components/form-modal/types";
import { EditOrganizationModal } from "./edit-organization-modal";
import { organizationFormFields } from "./organization-form-fields";
import type { Organization } from "@/types/organization";
import { formatDate, formatDateTime } from "@/lib/format";
import { createOrganization } from "@/lib/organizations";
import { cn } from "@/lib/utils";

const columns = [
  { label: "Sr", className: "w-[38px]" },
  { label: "#Id", className: "w-[76px] pl-[37px]" },
  { label: "Organization", className: "w-[187px]" },
  { label: "Owner", className: "w-[104px]" },
  { label: "Mobile", className: "w-[108px]" },
  { label: "Address", className: "w-[88px]" },
  { label: "Start Date", className: "w-[104px]" },
  { label: "End date", className: "w-[100px]" },
  { label: "Added By", className: "w-[168px]" },
  { label: "Added Date", className: "w-[163px]" },
  { label: "Action", className: "w-[84px]" },
];

function HeaderRow() {
  return (
    <tr>
      {columns.map((col) => (
        <th
          key={col.label}
          className={cn(
            "h-10 border-r border-white/30 bg-brand px-2.5 text-left text-[13px] font-bold whitespace-nowrap text-white last:border-r-0",
            col.className,
          )}
        >
          {col.label}
        </th>
      ))}
    </tr>
  );
}

export function OrganizationsTable({ organizations, loadError }: { organizations: Organization[]; loadError?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Organization | null>(null);

  // F2 opens the Add modal, matching the button hint (not while editing).
  const isEditing = editing !== null;
  useEffect(() => {
    if (isEditing) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "F2") {
        event.preventDefault();
        setAddOpen(true);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditing]);

  async function handleCreate(values: FormValues) {
    // Username/password are collected by the form but not stored yet (organization row only).
    await createOrganization({
      OrganizationName: values.OrganizationName,
      OrganizationOwnerName: values.OrganizationOwnerName,
      OrganizationMobile: values.OrganizationMobile,
      OrganizationAddress: values.OrganizationAddress,
      OrganizationTheme: values.OrganizationTheme,
    });
    router.refresh();
  }

  const query = search.trim().toLowerCase();
  const rows = query
    ? organizations.filter((org) =>
        [
          `#${org.OrganizationId}`,
          org.OrganizationName,
          org.OrganizationOwnerName,
          org.OrganizationMobile,
          org.OrganizationAddress,
          org.AddedBy,
        ].some((value) => value.toLowerCase().includes(query)),
      )
    : organizations;

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t-2 border-brand bg-white">
      <div className="flex h-[52px] shrink-0 items-center px-6">
        <h1 className="text-sm font-bold text-[#555]">Organization</h1>
        <label htmlFor="organization-search" className="ml-[34px] text-xs font-bold text-[#555]">
          Search
        </label>
        <input
          id="organization-search"
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="ml-5 h-[27px] w-[262px] border border-[#ccc] px-2 text-[13px] outline-none focus:border-brand-add"
        />
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="ml-auto h-[31px] w-[120px] rounded-[2px] bg-brand-add text-[13px] font-bold text-white transition-colors hover:bg-brand-add-hover"
        >
          Add <span className="text-[10px] font-normal">(F2)</span>
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="h-full w-full min-w-[1120px] border-separate border-spacing-0">
          <thead className="sticky top-0 z-10">
            <HeaderRow />
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className={cn("h-[140px] text-center text-[13px] font-semibold", loadError ? "text-red-600" : "text-[#888]")}
                >
                  {loadError ?? "No records found"}
                </td>
              </tr>
            ) : (
              rows.map((org, index) => (
                <tr
                  key={org.OrganizationId}
                  className="h-[35.5px] text-[12.5px] font-semibold text-[#333] even:bg-brand-row-alt [&>td]:border-r [&>td]:border-b [&>td]:border-[#e4e7eb] [&>td]:px-2.5 [&>td:last-child]:border-r-0"
                >
                  <td>{index + 1}</td>
                  <td className="pl-[37px]!">#{org.OrganizationId}</td>
                  <td>{org.OrganizationName}</td>
                  <td>{org.OrganizationOwnerName}</td>
                  <td>{org.OrganizationMobile}</td>
                  <td>{org.OrganizationAddress}</td>
                  <td>{formatDate(org.OrganizationStartDate)}</td>
                  <td>{formatDate(org.OrganizationEndDate)}</td>
                  <td>{org.AddedBy}</td>
                  <td>{formatDateTime(org.AddedDate)}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => setEditing(org)}
                      aria-label={`Action: ${org.OrganizationName}`}
                      className="rounded-[2px] bg-brand-action px-2.5 py-[3px] text-[10.5px] text-white hover:bg-brand-nav-active"
                    >
                      Action
                    </button>
                  </td>
                </tr>
              ))
            )}
            {/* Absorbs spare height so the footer header stays at the bottom of the card. */}
            <tr aria-hidden="true" className="h-auto">
              <td colSpan={columns.length} className="p-0" />
            </tr>
          </tbody>
          <tfoot className="sticky bottom-0 z-10">
            <HeaderRow />
          </tfoot>
        </table>
      </div>

      <FormModal
        open={addOpen}
        onOpenChange={setAddOpen}
        title="Add Organization"
        fields={organizationFormFields}
        onSubmit={handleCreate}
      />
      <EditOrganizationModal
        organization={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
    </section>
  );
}
