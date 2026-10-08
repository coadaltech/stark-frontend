"use client";

import type { ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";

const tabClass =
  "-mb-px h-[37px] shrink-0 rounded-t-[4px] border border-transparent px-7 text-[13.5px] whitespace-nowrap text-[#333] outline-none hover:border-[#e9ecef] hover:border-b-transparent focus-visible:ring-2 focus-visible:ring-brand/40 data-active:border-[#dee2e6] data-active:border-b-white data-active:bg-white data-active:text-brand";

/** The Permissions section: Role and Staff tabs. */
export function PermissionsTabs({ role, staff }: { role: ReactNode; staff: ReactNode }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col border-t-2 border-brand bg-white">
      <Tabs.Root defaultValue="role" className="flex min-h-0 flex-1 flex-col">
        <div className="flex h-[52px] shrink-0 items-end gap-6 px-6">
          <h1 className="pb-3 text-sm font-bold text-[#555]">Permissions</h1>
          <Tabs.List className="flex border-b border-[#dee2e6]">
            <Tabs.Tab value="role" className={tabClass}>
              Role
            </Tabs.Tab>
            <Tabs.Tab value="staff" className={tabClass}>
              Staff
            </Tabs.Tab>
          </Tabs.List>
        </div>
        <Tabs.Panel value="role" className="flex min-h-0 flex-1 flex-col outline-none">
          {role}
        </Tabs.Panel>
        <Tabs.Panel value="staff" className="flex min-h-0 flex-1 flex-col outline-none">
          {staff}
        </Tabs.Panel>
      </Tabs.Root>
    </section>
  );
}
