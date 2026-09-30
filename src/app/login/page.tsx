import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { SiteFrame } from "@/components/layout/site-frame";

export const metadata: Metadata = { title: "Sign in · XYZ" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <SiteFrame>
      <LoginForm next={typeof next === "string" ? next : undefined} />
    </SiteFrame>
  );
}
