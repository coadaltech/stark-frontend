import { ApiUnavailableError } from "@/lib/auth/tokens";

// proxy.ts rewrites here when the API can't say which site a host is → the error page.
export default function SiteUnavailablePage() {
  throw new ApiUnavailableError();
}
