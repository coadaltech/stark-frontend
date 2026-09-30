"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/lib/auth/actions";

const controlClass =
  "h-[34px] w-full border border-[#ced4da] bg-white px-2.5 text-[13px] font-semibold text-[#333] outline-none placeholder:font-normal placeholder:text-[#c4c4c4] focus:border-[#e6c45b] focus:bg-[#fde8a0]";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="w-full max-w-sm border-t-2 border-brand bg-white px-6 py-7 shadow-sm">
      <h1 className="text-lg font-bold text-[#333]">Sign in</h1>
      <p className="mt-1 text-xs text-muted-foreground">Enter your username and password to continue.</p>

      {next && <input type="hidden" name="next" value={next} />}

      <label className="mt-5 block text-xs font-semibold text-[#555]" htmlFor="userName">
        Username
      </label>
      <input
        id="userName"
        name="userName"
        autoComplete="username"
        autoFocus
        required
        maxLength={30}
        // Keep what was typed after a failed attempt (React resets uncontrolled forms after an action).
        key={state.userName}
        defaultValue={state.userName}
        className={`mt-1 ${controlClass}`}
      />

      <label className="mt-3 block text-xs font-semibold text-[#555]" htmlFor="password">
        Password
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        maxLength={72}
        className={`mt-1 ${controlClass}`}
      />

      {state.error && (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 h-[34px] w-full bg-brand-action text-sm font-semibold text-white transition-colors hover:bg-brand-nav-active disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
