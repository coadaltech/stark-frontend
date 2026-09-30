import type { ReactNode } from "react";
import { AppFooter } from "@/components/layout/app-footer";

/** The teal app frame without navigation — for sign-in and site-level pages. */
export function SiteFrame({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col bg-brand">
      <header className="flex h-[58px] shrink-0 items-center gap-3 px-[18px] text-white">
        <span className="text-[26px] leading-none font-bold tracking-tight">XYZ</span>
        {title && <span className="truncate text-sm font-semibold text-white/85">{title}</span>}
      </header>
      <div className="mx-[18px] flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-brand-page p-[15px]">
          {children}
        </main>
      </div>
      <div className="mx-[18px] mb-1.5">
        <AppFooter />
      </div>
    </div>
  );
}

/** A white card like the sign-in card, for short messages. */
export function MessageCard({ heading, children }: { heading: string; children?: ReactNode }) {
  return (
    <section className="w-full max-w-sm border-t-2 border-brand bg-white px-6 py-7 text-center shadow-sm">
      <h1 className="text-lg font-bold text-[#333]">{heading}</h1>
      {children && <div className="mt-2 text-xs text-muted-foreground">{children}</div>}
    </section>
  );
}
