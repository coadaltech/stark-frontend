import type { Metadata } from "next";
import { getAccessToken, requireSession } from "@/lib/auth/session";
import { requireOrganizationSite } from "@/lib/org-site";
import { getOrganizationInfo, type OrganizationInfo } from "@/lib/organization-site";

export async function generateMetadata({ params }: PageProps<"/site/[orgId]">): Promise<Metadata> {
  const site = await requireOrganizationSite((await params).orgId);
  return { title: `Organization-Info · ${site.name}` };
}

export default async function OrganizationInfoPage({ params }: PageProps<"/site/[orgId]">) {
  await requireOrganizationSite((await params).orgId);
  await requireSession();

  let info: OrganizationInfo | undefined;
  try {
    info = await getOrganizationInfo(await getAccessToken());
  } catch {
    // Shown below.
  }

  const rows: [string, string][] = info
    ? [
        ["Organization ID", `#${info.organizationId}`],
        ["Organization Name", info.name],
        ["Total Staff", String(info.totalStaff)],
      ]
    : [];

  return (
    <section className="flex min-h-0 flex-1 flex-col border-t-2 border-brand bg-white">
      <div className="flex h-[52px] shrink-0 items-center px-6">
        <h1 className="text-sm font-bold text-[#555]">Organization-Info</h1>
      </div>
      {info ? (
        <dl className="grid max-w-xl grid-cols-[180px_1fr] gap-y-3 px-6 py-4 text-[13px]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="font-bold text-[#555]">{label}</dt>
              <dd className="font-semibold text-[#333]">{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="px-6 py-4 text-[13px] font-semibold text-red-600">
          Could not load the organization details. Please try again.
        </p>
      )}
    </section>
  );
}
