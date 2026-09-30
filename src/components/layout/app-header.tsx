import Link from "next/link";
import { UserMenu } from "@/components/layout/user-menu";
import type { SessionUser } from "@/lib/auth/tokens";

export function AppHeader({ user }: { user: SessionUser }) {
  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between px-[18px] text-white">
      <Link href="/" className="text-[26px] leading-none font-bold tracking-tight">
        XYZ
      </Link>

      <div className="flex items-center">
        <span className="rounded-full border border-white/25 bg-brand-pill px-4 py-[3px] text-xs font-bold">
          [ ]
        </span>
        <span className="ml-2 rounded-full border border-white/25 bg-brand-pill px-5 py-[3px] text-xs font-bold tracking-wide">
          {user.roleName}
        </span>
        <span className="ml-6 max-w-[82px] truncate text-[13px]" title={user.userName}>
          {user.userName}
        </span>
        <UserMenu name={user.name} userName={user.userName} roleName={user.roleName} />
      </div>
    </header>
  );
}
