"use client";

import { useState } from "react";
import { updateProfileAction } from "@/app/actions/users";
import { signOut } from "@/app/actions/auth";
import Link from "next/link";

interface ProfileViewProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    role: string;
    emailNotificationsEnabled: boolean;
    createdAt?: Date | string;
    stripeCustomerId?: string | null;
  };
}

export function ProfileView({ user }: ProfileViewProps) {
  const [name, setName] = useState(user.name || "");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(
    user.emailNotificationsEnabled
  );

  const [isPending, setIsPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const isAdmin = user.role === "ADMIN";

  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "Recently";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setStatusMessage(null);

    try {
      await updateProfileAction(name, emailNotificationsEnabled);
      setStatusMessage({
        type: "success",
        text: "Profile updated successfully!",
      });
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err.message || "Failed to update profile",
      });
    } finally {
      setIsPending(false);
    }
  };

  const initialLetter = (name || user.email).charAt(0).toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="relative bg-surface-container-lowest border border-outline-variant rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xs">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            {/* Avatar Badge */}
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary to-surface-container-high border-2 border-outline-variant text-on-primary font-black text-3xl sm:text-4xl flex items-center justify-center shadow-md shrink-0">
                {initialLetter}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-surface-container-lowest" title="Active" />
            </div>

            {/* Basic Info Header */}
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-xl sm:text-2xl font-extrabold text-on-surface tracking-tight">
                  {name || "User Profile"}
                </h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isAdmin
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-surface-container-high text-on-surface-variant border border-outline-variant"
                  }`}
                >
                  {isAdmin ? "Administrator" : "Client"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-1 font-medium">
                {user.email}
              </p>
              <div className="flex items-center space-x-4 mt-2 text-[11px] text-outline font-medium">
                <span>Joined {formattedDate}</span>
                <span>•</span>
                <span>ID: {user.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          <form action={signOut}>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-surface-container-low hover:bg-surface-container-high border border-outline-variant text-on-surface transition-all shrink-0 cursor-pointer shadow-xs flex items-center space-x-2"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </form>
        </div>
      </div>

      {/* Main Details Form */}
      <div className="bg-surface-container-lowest border border-outline-variant p-6 sm:p-8 rounded-3xl shadow-xs">
        <h2 className="text-base font-bold text-on-surface mb-6">Profile Details</h2>

        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center space-x-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-700"
                : "bg-error-container border border-error/30 text-on-error-container"
            }`}
          >
            {statusMessage.type === "success" ? (
              <svg className="w-4 h-4 shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0 text-error" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                disabled={isPending}
                className="w-full bg-surface-container-lowest border border-outline-variant focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-4 py-3 text-sm text-on-surface outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Email Address (Read-Only)
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 text-sm text-on-surface-variant/70 cursor-not-allowed outline-none"
                />
                <span className="absolute right-3 top-3 text-[10px] bg-surface-container-high text-outline px-2 py-0.5 rounded-md font-semibold">
                  Verified
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Role / Access Level
              </label>
              <input
                type="text"
                value={isAdmin ? "System Administrator" : "Client Account"}
                disabled
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 text-sm text-on-surface-variant/70 cursor-not-allowed outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-outline uppercase tracking-wider mb-2">
                Member Since
              </label>
              <input
                type="text"
                value={formattedDate}
                disabled
                className="w-full bg-surface-container-low border border-outline-variant/60 rounded-xl px-4 py-3 text-sm text-on-surface-variant/70 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-outline-variant/40">
            <h3 className="text-xs font-bold text-outline uppercase tracking-wider mb-4">
              Preferences & Notifications
            </h3>
            <label className="flex items-start space-x-3.5 group cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailNotificationsEnabled}
                onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                disabled={isPending}
                className="mt-0.5 rounded border-outline-variant text-primary focus:ring-primary h-4 w-4 cursor-pointer"
              />
              <div>
                <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors">
                  Enable Email Notifications
                </p>
                <p className="text-[10px] text-on-surface-variant mt-0.5 leading-relaxed">
                  Receive email notifications for project updates, status changes, new messages, and billing events.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-6 border-t border-outline-variant/40 flex items-center justify-between">
            <Link
              href={isAdmin ? "/admin" : "/overview"}
              className="text-xs font-semibold text-outline hover:text-on-surface transition-colors"
            >
              ← Back to Dashboard
            </Link>

            <button
              type="submit"
              disabled={isPending}
              className="bg-primary hover:bg-primary-container text-on-primary font-bold text-xs px-6 py-2.5 rounded-xl transition-all shadow-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending && (
                <span className="w-3.5 h-3.5 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" />
              )}
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
