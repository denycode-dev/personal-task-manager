"use client";

import { useActionState } from "react";
import { loginAction } from "@/features/auth/actions/login.action";
import { Button } from "@/components/ui/button";
import { LockKey, SignIn, CircleNotch } from "@phosphor-icons/react";

export function LoginForm() {
  const [state, action, isPending] = useActionState(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="password" className="block text-xs font-bold mb-1 text-black">
          Password Aplikasi
        </label>
        <div className="relative">
          <LockKey
            size={16}
            weight="bold"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500"
          />
          <input
            type="password"
            id="password"
            name="password"
            required
            autoFocus
            disabled={isPending}
            suppressHydrationWarning
            className="w-full pl-9 pr-3 py-2 text-xs border-2 border-black focus:outline-none focus:bg-yellow-50 disabled:opacity-50"
            placeholder="Masukkan password..."
          />
        </div>
      </div>

      {state?.error && (
        <div className="p-2.5 bg-red-50 border-2 border-red-600 text-red-700 text-xs font-bold">
          {state.error}
        </div>
      )}

      <button
        suppressHydrationWarning
        type="submit"
        disabled={isPending}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-black bg-yellow-400 hover:bg-yellow-300 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-0.5 transition-transform disabled:opacity-50 min-h-[36px]"
      >
        {isPending ? (
          <>
            <CircleNotch size={16} weight="bold" className="animate-spin" />
            <span>Memproses...</span>
          </>
        ) : (
          <>
            <SignIn size={16} weight="bold" />
            <span>Masuk</span>
          </>
        )}
      </button>
    </form>
  );
}
