"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDownIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type NavMenu = {
  label: string;
  items: {
    label: string;
    href: string;
    dropDownItems?: { label: string; href: string }[];
  }[];
};

/**
 * The page's path as the visitor sees it. Organization sites are served from internal
 * /site/<orgId>/… routes (proxy rewrite); strip that prefix if it shows up.
 */
function visiblePath(pathname: string) {
  return pathname.replace(/^\/site\/\d+(?=\/|$)/, "") || "/";
}

const tabClass =
  "flex h-full items-center px-4 text-sm font-medium text-white outline-none transition-colors hover:bg-brand-nav-active/60 focus-visible:bg-brand-nav-active/60";

/** The tab bar under the header: a home tab plus dropdown menus. */
export function NavBar({ home, menus }: { home: { label: string; href: string }; menus: NavMenu[] }) {
  const pathname = visiblePath(usePathname());

  return (
    <nav className="flex h-[34px] shrink-0 items-stretch bg-brand-nav">
      <Link
        href={home.href}
        className={cn(tabClass, pathname === home.href && "bg-brand-nav-active")}
      >
        {home.label}
      </Link>

      {menus.map((menu) => {
        const active = menu.items.some((item) =>
          pathname.startsWith(item.href),
        );
        return (
          <DropdownMenu key={menu.label}>
            <DropdownMenuTrigger
              className={cn(
                tabClass,
                "gap-0.5 data-popup-open:bg-brand-nav-active",
                active && "bg-brand-nav-active",
              )}
            >
              {menu.label}
              <ChevronDownIcon className="size-3.5" strokeWidth={3} />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={0}
              className="w-auto min-w-44 rounded-none rounded-b-sm p-0 py-1"
            >
              {menu.items
                .flatMap((item) => item.dropDownItems || [item])
                .map((item) => (
                  <DropdownMenuItem
                    key={item.href}
                    render={<Link href={item.href} />}
                    className={cn(
                      "rounded-none px-4 py-2 text-[13px] font-medium",
                      pathname.startsWith(item.href) && "text-brand",
                    )}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}
