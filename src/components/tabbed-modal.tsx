"use client";

import type { ReactNode } from "react";
import { Tabs } from "@base-ui/react/tabs";
import { Modal } from "@/components/modal";
import { cn } from "@/lib/utils";

export type ModalTab = {
  value: string;
  label: string;
  /** Tab body; tabs without content show a placeholder. */
  content?: ReactNode;
};

type TabbedModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  tabs: ModalTab[];
  defaultTab?: string;
  className?: string;
};

/** Modal whose body is a row of tabs (e.g. an entity's settings split into sections). */
export function TabbedModal({ open, onOpenChange, title, tabs, defaultTab, className }: TabbedModalProps) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title} className={cn("top-[13px] w-[1078px]", className)}>
      <Tabs.Root defaultValue={defaultTab ?? tabs[0]?.value} className="flex min-h-0 flex-1 flex-col px-[15px] pt-4 pb-[30px]">
        <Tabs.List className="flex shrink-0 overflow-x-auto border-b border-[#dee2e6] px-[15px]">
          {tabs.map((tab) => (
            <Tabs.Tab
              key={tab.value}
              value={tab.value}
              className="-mb-px h-[37px] shrink-0 rounded-t-[4px] border border-transparent px-7 text-[13.5px] whitespace-nowrap text-[#333] outline-none hover:border-[#e9ecef] hover:border-b-transparent focus-visible:ring-2 focus-visible:ring-brand/40 data-active:border-[#dee2e6] data-active:border-b-white data-active:bg-white data-active:text-brand"
            >
              {tab.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>
        {tabs.map((tab) => (
          <Tabs.Panel key={tab.value} value={tab.value} className="min-h-0 flex-1 overflow-y-auto px-[15px] pt-4 outline-none">
            {tab.content ?? <p className="py-10 text-center text-[13px] text-[#999]">Coming soon</p>}
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </Modal>
  );
}
