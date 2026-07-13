"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signUpWithEmail } from "@/app/actions/auth";

export default function SignupPage() {
  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-zinc-950 to-zinc-950 pointer-events-none" />

      <div className="relative w-full max-w-md bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-sm text-zinc-500 mt-2">
            Get started with FAMX professional services
          </p>
        </div>

        {state?.error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-400 text-xs flex items-center space-x-2">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{state.error}</span>
          </div>
        )}

        <form action={formAction} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="John Doe"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="name@example.com"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="Minimum 6 characters"
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all duration-200"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium py-3 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-900/30 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-xs text-zinc-500">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
