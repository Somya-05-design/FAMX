"use client";

import { useActionState, Suspense } from "react";
import Link from "next/link";
import { resetPasswordForEmail } from "@/app/actions/auth";
import AuthLayout from "@/components/AuthLayout";

function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState(resetPasswordForEmail, null);

  return (
    <div className="w-full">
      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Forgot Password?
        </h1>
        <p className="text-sm font-medium text-zinc-400 mt-1.5">
          Enter your email and we'll send you a password reset link
        </p>
      </div>

      {/* Success Alert */}
      {state?.success && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
          <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{state.success}</span>
        </div>
      )}

      {/* Error Alert */}
      {state?.error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
          <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      {/* Form */}
      <form action={formAction} className="space-y-5">
        <div className="relative">
          <input
            type="email"
            name="email"
            required
            placeholder="Enter your registered email"
            className="w-full bg-white border border-zinc-300 focus:border-[#3B5FE0] focus:ring-1 focus:ring-[#3B5FE0] rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all pr-11"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#3B5FE0] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3.5 rounded-full text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
        >
          {isPending ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Send Reset Link</span>
          )}
        </button>
      </form>

      {/* Back to Login link */}
      <div className="mt-8 text-center">
        <Link
          href="/login"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span>Back to Sign in</span>
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <span className="w-8 h-8 border-2 border-[#3B5FE0]/30 border-t-[#3B5FE0] rounded-full animate-spin" />
          </div>
        }
      >
        <ForgotPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
