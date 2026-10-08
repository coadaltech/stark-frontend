import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { canManagePermissions } from "@/lib/roles";

export async function generateMetadata({ params }: PageProps<"/site/[orgId]/permissions">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `Permissions · ${site.name}` };
}

// Placeholder until the Role and Staff tabs (permissions layers 07 and 08).
export default async function PermissionsPage({ params }: PageProps<"/site/[orgId]/permissions">) {
  await requireOrganizationSite((await params).orgId);
  const user = await requireSession();
  if (!canManagePermissions(user.roleId)) notFound();

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t-2 border-brand bg-white">
      <div className="flex h-[52px] shrink-0 items-center px-6">
        <h1 className="text-sm font-bold text-[#555]">Permissions</h1>
      </div>
      <p className="px-6 py-4 text-[13px] font-semibold text-[#888]">Role and staff permissions are coming soon.</p>
    </section>
  );
}
