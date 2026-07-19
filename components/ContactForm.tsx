"use client";

import { useActionState } from "react";
import { submitContactInquiryAction } from "@/app/actions/contact";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactInquiryAction, null);

  return (
    <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/80 p-8 rounded-2xl shadow-2xl relative">
      <div className="absolute top-0 right-0 w-40 h-40 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
      
      {state?.success ? (
        <div className="text-center py-10 space-y-4">
          <div className="w-12 h-12 bg-emerald-950/40 border border-emerald-800/50 rounded-full flex items-center justify-center mx-auto text-emerald-400">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Inquiry Received</h3>
          <p className="text-sm text-zinc-400 max-w-sm mx-auto leading-relaxed">
            Thank you for reaching out! Our engineering and design team will review your message and reply within 24 hours.
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-zinc-100">Send us a Message</h3>
            <p className="text-xs text-zinc-400">Have a custom requirement? Fill out the form below to start the conversation.</p>
          </div>

          {state?.error && (
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-400 text-xs flex items-center space-x-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          {/* Honeypot field (hidden from screen readers and visual users) */}
          <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <label htmlFor="website">Website URL (leave blank)</label>
            <input
              type="text"
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Your Name
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
                placeholder="name@company.com"
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
              Message / Details
            </label>
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Tell us about your project requirements, scope, and goals..."
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl px-4 py-3 text-sm text-zinc-200 outline-none transition-all duration-200 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-indigo-900/30 flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <span>Submit Inquiry</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
