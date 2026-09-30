"use client";

/** Shown when a page can't render — in practice, when the API can't be reached. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-4 bg-brand-page p-6 text-center">
      <p className="text-sm font-semibold text-[#333]">Could not load this page. Please check that the API is running.</p>
      <button
        type="button"
        onClick={reset}
        className="h-[34px] bg-brand-action px-5 text-sm font-semibold text-white transition-colors hover:bg-brand-nav-active"
      >
        Try again
      </button>
    </div>
  );
}
