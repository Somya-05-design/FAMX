"use client";

import { useActionState } from "react";
import { submitContactInquiryAction } from "@/app/actions/contact";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactInquiryAction, null);

  return (
    <div className="bg-white border border-zinc-200/80 p-8 sm:p-10 rounded-3xl shadow-xl shadow-zinc-950/5 relative">
      {state?.success ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-zinc-900">Inquiry Received</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Thank you for reaching out! Our engineering and design team will review your message and reply shortly.
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold flex items-center space-x-2">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{state.error}</span>
            </div>
          )}

          {/* Honeypot field */}
          <div className="absolute w-0 h-0 opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
            <label htmlFor="website">Website URL (leave blank)</label>
            <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="John Doe"
                className="w-full bg-zinc-50 border border-zinc-200/80 focus:border-zinc-900 focus:bg-white rounded-2xl px-4 py-3 text-xs font-bold text-zinc-900 outline-none transition-all placeholder-zinc-400 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="name@company.com"
                className="w-full bg-zinc-50 border border-zinc-200/80 focus:border-zinc-900 focus:bg-white rounded-2xl px-4 py-3 text-xs font-bold text-zinc-900 outline-none transition-all placeholder-zinc-400 shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5">
              Project Type
            </label>
            <div className="relative">
              <select
                name="projectType"
                defaultValue="Web Development"
                className="w-full bg-zinc-50 border border-zinc-200/80 focus:border-zinc-900 focus:bg-white text-zinc-900 text-xs font-bold rounded-2xl px-4 py-3 outline-none transition-all cursor-pointer appearance-none shadow-sm"
              >
                <option value="Web Development">Web Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Custom Request">Custom Request</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-400">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider mb-1.5">
              Message
            </label>
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Tell us about your project..."
              className="w-full bg-zinc-50 border border-zinc-200/80 focus:border-zinc-900 focus:bg-white rounded-2xl px-4 py-3 text-xs font-bold text-zinc-900 outline-none transition-all resize-none placeholder-zinc-400 shadow-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-black hover:bg-zinc-800 text-white font-bold py-3.5 px-8 rounded-full text-xs transition-all duration-200 shadow-md cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin block mx-auto" />
            ) : (
              <span>Send Message</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
