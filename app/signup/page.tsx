"use client";

import { useActionState, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { signUpWithEmail } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import AuthLayout from "@/components/AuthLayout";

function SignupForm() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "";

  const [state, formAction, isPending] = useActionState(signUpWithEmail, null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignup = async () => {
    try {
      setGoogleLoading(true);
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next || "/overview")}`,
        },
      });
    } catch (err) {
      console.error("Google sign up error:", err);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Title & Subtitle */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
          Create Account
        </h1>
        <p className="text-sm font-medium text-zinc-400 mt-1.5">
          Get started with FAMX professional services
        </p>
      </div>

      {/* Sign In / Sign Up Pill Switcher */}
      <div className="inline-flex bg-zinc-100/80 p-1 rounded-full mb-8 border border-zinc-200/60">
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="text-zinc-500 hover:text-zinc-900 font-medium rounded-full px-7 py-2 text-sm transition-colors flex items-center justify-center"
        >
          Sign in
        </Link>
        <span className="bg-[#3B5FE0] text-white font-semibold rounded-full px-7 py-2 text-sm shadow-sm">
          Sign Up
        </span>
      </div>

      {/* Error Alert */}
      {state?.error && (
        <div className="mb-6 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs flex items-center space-x-2">
          <svg className="w-4 h-4 shrink-0 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{state.error}</span>
        </div>
      )}

      {/* Signup Form */}
      <form action={formAction} className="space-y-4">
        <input type="hidden" name="next" value={next} />

        {/* Name Field */}
        <div className="relative">
          <input
            type="text"
            name="name"
            required
            placeholder="Enter your full name"
            className="w-full bg-white border border-zinc-300 focus:border-[#3B5FE0] focus:ring-1 focus:ring-[#3B5FE0] rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all pr-11"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
        </div>

        {/* Email Field with Envelope Icon */}
        <div className="relative">
          <input
            type="email"
            name="email"
            required
            placeholder="Enter your email"
            className="w-full bg-white border border-zinc-300 focus:border-[#3B5FE0] focus:ring-1 focus:ring-[#3B5FE0] rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all pr-11"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </div>
        </div>

        {/* Password Field with Eye Toggle */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            required
            placeholder="Minimum 6 characters"
            className="w-full bg-white border border-zinc-300 focus:border-[#3B5FE0] focus:ring-1 focus:ring-[#3B5FE0] rounded-xl px-4 py-3.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all pr-11"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12c1.349-4.39 5.37-7.5 10.007-7.5 4.636 0 8.658 3.11 10.007 7.5-1.349 4.39-5.371 7.5-10.007 7.5-4.637 0-8.658-3.11-10.007-7.5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </button>
        </div>

        {/* Primary Submit Button */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full bg-[#3B5FE0] hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3.5 rounded-full text-sm shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer pt-3 mt-4"
        >
          {isPending ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <span>Create Account</span>
          )}
        </button>
      </form>

      {/* OR Divider */}
      <div className="relative flex py-5 items-center justify-center">
        <div className="grow border-t border-zinc-200"></div>
        <span className="shrink mx-4 text-xs font-semibold text-zinc-400 tracking-wider">OR</span>
        <div className="grow border-t border-zinc-200"></div>
      </div>

      {/* Google OAuth Button */}
      <button
        type="button"
        onClick={handleGoogleSignup}
        disabled={googleLoading}
        className="w-full border border-zinc-200 hover:border-zinc-300 bg-white hover:bg-zinc-50/80 text-zinc-800 font-semibold py-3 rounded-full text-sm flex items-center justify-center space-x-3 transition-all cursor-pointer shadow-xs disabled:opacity-60"
      >
        {googleLoading ? (
          <span className="w-4 h-4 border-2 border-zinc-400 border-t-zinc-700 rounded-full animate-spin" />
        ) : (
          <>
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Log in with Google</span>
          </>
        )}
      </button>
    </div>
  );
}

export default function SignupPage() {
  return (
    <AuthLayout>
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <span className="w-8 h-8 border-2 border-[#3B5FE0]/30 border-t-[#3B5FE0] rounded-full animate-spin" />
          </div>
        }
      >
        <SignupForm />
      </Suspense>
    </AuthLayout>
  );
}
