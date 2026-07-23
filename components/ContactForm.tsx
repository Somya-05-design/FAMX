"use client";

import { useActionState } from "react";
import { submitContactInquiryAction } from "@/app/actions/contact";

export function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactInquiryAction, null);

  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-8 sm:p-10 rounded-3xl relative">
      {state?.success ? (
        <div className="text-center py-12 space-y-4">
          <div className="w-14 h-14 bg-inverse-primary/20 border border-primary/20 rounded-full flex items-center justify-center mx-auto text-primary">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-on-surface">Inquiry Received</h3>
          <p className="text-xs text-on-surface-variant max-w-sm mx-auto leading-relaxed">
            Thank you for reaching out! Our engineering and design team will review your message and reply shortly.
          </p>
        </div>
      ) : (
        <form action={formAction} className="space-y-5">
          {state?.error && (
            <div className="p-4 rounded-2xl bg-error-container border border-error/30 text-on-error-container text-xs font-semibold flex items-center space-x-2">
              <svg className="w-4 h-4 shrink-0 text-error" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
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
              <label className="block text-[10px] font-extrabold text-outline uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="John Doe"
                className="w-full bg-surface-container-low border border-outline-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary focus:bg-surface-container-lowest rounded-2xl px-4 py-3 text-xs font-bold text-on-surface outline-none transition-all placeholder-outline"
              />
            </div>
            <div>
              <label className="block text-[10px] font-extrabold text-outline uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="name@company.com"
                className="w-full bg-surface-container-low border border-outline-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary focus:bg-surface-container-lowest rounded-2xl px-4 py-3 text-xs font-bold text-on-surface outline-none transition-all placeholder-outline"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-outline uppercase tracking-wider mb-1.5">
              Project Type
            </label>
            <div className="relative">
              <select
                name="projectType"
                defaultValue="Web Development"
                className="w-full bg-surface-container-low border border-outline-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary focus:bg-surface-container-lowest text-on-surface text-xs font-bold rounded-2xl px-4 py-3 outline-none transition-all cursor-pointer appearance-none"
              >
                <option value="Web Development">Web Development</option>
                <option value="UI/UX Design">UI/UX Design</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Custom Request">Custom Request</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-outline">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-outline uppercase tracking-wider mb-1.5">
              Message
            </label>
            <textarea
              name="message"
              required
              rows={4}
              placeholder="Tell us about your project..."
              className="w-full bg-surface-container-low border border-outline-variant focus:border-tertiary focus:ring-1 focus:ring-tertiary focus:bg-surface-container-lowest rounded-2xl px-4 py-3 text-xs font-bold text-on-surface outline-none transition-all resize-none placeholder-outline"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="bg-primary hover:bg-primary-container text-on-primary font-bold py-3.5 px-8 rounded-full text-xs transition-all duration-200 shadow-xs cursor-pointer disabled:opacity-50"
          >
            {isPending ? (
              <span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin block mx-auto" />
            ) : (
              <span>Send Message</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
