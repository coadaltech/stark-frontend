import Link from "next/link";

// Static until auth is wired up.
const currentUser = { name: "DYNAMIC_SUPPORT", role: "DEVELOPER", initial: "D" };

export function AppHeader() {
  return (
    <header className="flex h-[58px] shrink-0 items-center justify-between px-[18px] text-white">
      <Link href="/" className="text-[26px] leading-none font-bold tracking-tight">
        OrgStark
      </Link>

      <div className="flex items-center">
        <span className="rounded-full border border-white/25 bg-brand-pill px-4 py-[3px] text-xs font-bold">
          [ ]
        </span>
        <span className="ml-2 rounded-full border border-white/25 bg-brand-pill px-5 py-[3px] text-xs font-bold tracking-wide">
          {currentUser.role}
        </span>
        <span className="ml-6 max-w-[82px] truncate text-[13px]" title={currentUser.name}>
          {currentUser.name}
        </span>
        <span className="relative ml-4 grid size-9 place-items-center rounded-full bg-white text-sm font-bold text-brand">
          {currentUser.initial}
          <span className="absolute -top-0.5 right-0 size-2.5 rounded-full bg-red-500 ring-2 ring-white" />
        </span>
      </div>
    </header>
  );
}
