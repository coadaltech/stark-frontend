"use client";

import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { logout } from "@/lib/auth/actions";

type UserMenuProps = { name: string; userName: string; roleName: string };

export function UserMenu({ name, userName, roleName }: UserMenuProps) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Account menu"
        className="ml-4 grid size-9 cursor-pointer place-items-center rounded-full bg-white text-sm font-bold text-brand outline-none focus-visible:ring-2 focus-visible:ring-white/70"
      >
        {(name.trim()[0] ?? userName[0] ?? "?").toUpperCase()}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Plain div: Base UI's group label must sit inside a Menu.Group. */}
        <div className="px-1.5 py-1">
          <p className="truncate text-sm font-semibold" title={name}>
            {name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {userName} · {roleName}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={pending} onClick={() => startTransition(() => logout())}>
          <LogOutIcon />
          {pending ? "Signing out…" : "Logout"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
