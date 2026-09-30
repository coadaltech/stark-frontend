import { MessageCard, SiteFrame } from "@/components/layout/site-frame";

export default function SiteNotFound() {
  return (
    <SiteFrame>
      <MessageCard heading="Site not found">There is no site at this address.</MessageCard>
    </SiteFrame>
  );
}
