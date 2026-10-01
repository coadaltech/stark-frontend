"use client";

import { NavBar, type NavMenu } from "@/components/layout/nav-bar";

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

export function MainNav() {
  return <NavBar home={{ label: "Dashboard", href: "/" }} menus={menus} />;
}
