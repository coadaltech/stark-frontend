import { requireSession } from "@/lib/auth/session";

export default async function DashboardPage() {
  await requireSession();
  return <section className="flex-1 border-t-2 border-brand bg-white" />;
}
