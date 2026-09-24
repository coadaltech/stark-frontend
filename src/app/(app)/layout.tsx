import { AppFooter } from "@/components/layout/app-footer";
import { AppHeader } from "@/components/layout/app-header";
import { MainNav } from "@/components/layout/main-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex h-dvh flex-col bg-brand">
      <AppHeader />
      <div className="mx-[18px] flex min-h-0 flex-1 flex-col">
        <MainNav />
        <main className="flex min-h-0 flex-1 flex-col bg-brand-page p-[15px]">
          {children}
        </main>
      </div>
      <div className="mx-[18px] mb-1.5">
        <AppFooter />
      </div>
    </div>
  );
}
