import type { Metadata } from "next";
import { AppFooter } from "@/components/layout/app-footer";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = { title: "Sign in · XYZ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="flex h-dvh flex-col bg-brand">
      <header className="flex h-[58px] shrink-0 items-center px-[18px] text-white">
        <span className="text-[26px] leading-none font-bold tracking-tight">XYZ</span>
      </header>
      <div className="mx-[18px] flex min-h-0 flex-1 flex-col">
        <main className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto bg-brand-page p-[15px]">
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </main>
      </div>
      <div className="mx-[18px] mb-1.5">
        <AppFooter />
      </div>
    </div>
  );
}
