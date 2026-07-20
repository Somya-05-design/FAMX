"use client";

import { useState, useEffect } from "react";

interface Project {
  id: string;
  title: string;
  proposedBudget: number;
  client: { name: string | null; email: string };
}

interface QuoteEntryModalProps {
  isOpen: boolean;
  project: Project | null;
  onSubmit: (amount: number) => Promise<void> | void;
  onClose: () => void;
}

export function QuoteEntryModal({ isOpen, project, onSubmit, onClose }: QuoteEntryModalProps) {
  const [quoteAmount, setQuoteAmount] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (project) {
      setQuoteAmount(project.proposedBudget.toString());
      setError("");
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const amount = parseFloat(quoteAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid quote amount greater than 0");
      return;
    }

    setIsPending(true);
    try {
      await onSubmit(amount);
    } catch (err: any) {
      setError(err.message || "Failed to submit quote");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-zinc-200/80 p-7 rounded-3xl shadow-2xl shadow-zinc-950/10 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-xl font-bold text-zinc-900 tracking-tight">Set Quote for Project</h3>
          <p className="text-sm text-zinc-500 mt-1">
            Specify the quote amount for <span className="font-bold text-zinc-900">{project.title}</span>.
          </p>
        </div>

        {/* Project Info Box */}
        <div className="bg-zinc-100/80 p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-xs text-zinc-500 font-medium pt-0.5">Client:</span>
            <div className="text-right">
              <span className="text-sm font-bold text-zinc-900 block">{project.client.name || "Client"}</span>
              <span className="text-xs text-zinc-400 block mt-0.5">{project.client.email}</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-2.5 border-t border-zinc-200/60">
            <span className="text-xs text-zinc-500 font-medium">Proposed Budget:</span>
            <span className="text-sm font-bold text-zinc-900">
              ${project.proposedBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
              QUOTE AMOUNT (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3.5 text-zinc-400 font-semibold text-base">$</span>
              <input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder={project.proposedBudget.toString()}
                min="0.01"
                step="0.01"
                required
                disabled={isPending}
                className="w-full bg-white border border-zinc-200 focus:border-purple-600 focus:ring-1 focus:ring-purple-600 rounded-2xl pl-8 pr-4 py-3 text-lg font-bold text-zinc-900 outline-none transition-all shadow-sm"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer disabled:opacity-50 shadow-md shadow-purple-600/20"
            >
              {isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Submit & Quote</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
