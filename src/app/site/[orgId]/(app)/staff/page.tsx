import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { canManageStaff } from "@/lib/roles";

export async function generateMetadata({ params }: PageProps<"/site/[orgId]/staff">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `Staff · ${site.name}` };
}

// Placeholder until the Staff list and Add Staff (layer 11).
export default async function StaffPage({ params }: PageProps<"/site/[orgId]/staff">) {
  await requireOrganizationSite((await params).orgId);
  const user = await requireSession();
  if (!canManageStaff(user.roleId)) notFound();

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t-2 border-brand bg-white">
      <div className="flex h-[52px] shrink-0 items-center px-6">
        <h1 className="text-sm font-bold text-[#555]">Staff</h1>
      </div>
      <p className="px-6 py-4 text-[13px] font-semibold text-[#888]">Staff list is coming soon.</p>
    </section>
  );
}
