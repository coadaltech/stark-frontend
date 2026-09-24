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

type NavMenu = {
  label: string;
  items: {
    label: string;
    href: string;
    dropDownItems?: { label: string; href: string }[];
  }[];
};

const menus: NavMenu[] = [
  {
    label: "Organizations",
    items: [
      {
        label: "Organization",
        href: "/organizations",
        dropDownItems: [
          {
            label: "Organization",
            href: "/organizations",
          },
        ],
      },
    ],
  },
];

const tabClass =
  "flex h-full items-center px-4 text-sm font-medium text-white outline-none transition-colors hover:bg-brand-nav-active/60 focus-visible:bg-brand-nav-active/60";

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex h-[34px] shrink-0 items-stretch bg-brand-nav">
      <Link
        href="/"
        className={cn(tabClass, pathname === "/" && "bg-brand-nav-active")}
      >
        Dashboard
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
