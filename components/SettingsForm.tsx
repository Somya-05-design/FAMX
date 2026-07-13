"use client";

import { useState } from "react";
import { updateProfileAction } from "@/app/actions/users";
import { requestBillingPortalAction } from "@/app/actions/payments";

interface SettingsFormProps {
  user: {
    name: string | null;
    email: string;
    emailNotificationsEnabled: boolean;
    stripeCustomerId: string | null;
  };
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [name, setName] = useState(user.name || "");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(user.emailNotificationsEnabled);
  
  const [isPending, setIsPending] = useState(false);
  const [isPortalPending, setIsPortalPending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    setStatusMessage(null);

    try {
      await updateProfileAction(name, emailNotificationsEnabled);
      setStatusMessage({ type: "success", text: "Settings updated successfully!" });
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "Failed to update profile settings" });
    } finally {
      setIsPending(false);
    }
  };

  const handlePortalRedirect = async () => {
    setIsPortalPending(true);
    try {
      const result = await requestBillingPortalAction();
      if (result?.url) {
        window.location.href = result.url;
      } else {
        alert("Failed to retrieve billing dashboard link");
      }
    } catch (err: any) {
      alert(err.message || "Failed to launch billing dashboard");
    } finally {
      setIsPortalPending(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 1. Account Settings form */}
      <div className="lg:col-span-2 bg-zinc-900/20 border border-zinc-800/80 p-6 md:p-8 rounded-2xl">
        <h2 className="text-lg font-bold text-zinc-200 mb-6">Profile Settings</h2>

        {statusMessage && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs flex items-center space-x-2 ${
              statusMessage.type === "success"
                ? "bg-emerald-950/30 border border-emerald-800/50 text-emerald-400"
                : "bg-rose-950/30 border border-rose-800/50 text-rose-400"
            }`}
          >
            {statusMessage.type === "success" ? (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full bg-zinc-900 border border-zinc-800/40 rounded-xl px-4 py-3 text-sm text-zinc-500 cursor-not-allowed outline-none"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-900">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4">Notification Preferences</h3>
            <label className="flex items-start space-x-3.5 group cursor-pointer select-none">
              <input
                type="checkbox"
                checked={emailNotificationsEnabled}
                onChange={(e) => setEmailNotificationsEnabled(e.target.checked)}
                disabled={isPending}
                className="mt-0.5 rounded border-zinc-800 text-violet-600 focus:ring-violet-500 bg-zinc-950 w-4 h-4 cursor-pointer"
              />
              <div>
                <p className="text-xs font-semibold text-zinc-300 group-hover:text-zinc-200 transition-colors">
                  Enable Email Notifications
                </p>
                <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">
                  Receive transactional alerts on quote updates, payment requests, project deliveries, and chat replies.
                </p>
              </div>
            </label>
          </div>

          <div className="pt-6 border-t border-zinc-900 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/20 flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              {isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Save Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Billing panel */}
      <div className="bg-zinc-900/20 border border-zinc-800/80 p-6 md:p-8 rounded-2xl flex flex-col justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-200 mb-2">Billing & Invoices</h2>
          <p className="text-xs text-zinc-400 leading-relaxed mb-6">
            View past payments, download PDF receipts, and update your saved payment cards on file.
          </p>

          {!user.stripeCustomerId ? (
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl text-center">
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                Billing dashboard will activate once you receive your first quote invoice and make a payment.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-violet-950/10 border border-violet-900/20 rounded-xl">
              <p className="text-[10px] text-violet-400 leading-relaxed font-semibold">
                Stripe Customer account active.
              </p>
            </div>
          )}
        </div>

        {user.stripeCustomerId && (
          <button
            onClick={handlePortalRedirect}
            disabled={isPortalPending}
            className="w-full mt-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 hover:border-zinc-700 font-semibold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-50"
          >
            {isPortalPending ? (
              <span className="w-3.5 h-3.5 border-2 border-zinc-200/30 border-t-zinc-200 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
            <span>Billing Dashboard</span>
          </button>
        )}
      </div>
    </div>
  );
}
