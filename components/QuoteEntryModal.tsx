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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800/80 p-6 rounded-2xl shadow-xl shadow-black/40 space-y-6">
        {/* Header */}
        <div>
          <h3 className="text-base font-bold text-zinc-100">Set Quote for Project</h3>
          <p className="text-xs text-zinc-400 mt-1">
            Specify the binding quote amount for <span className="font-semibold text-zinc-200">{project.title}</span>.
          </p>
        </div>

        {/* Project Info */}
        <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-xl space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Client:</span>
            <span className="text-zinc-300 font-medium">{project.client.name || "Client"} ({project.client.email})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500">Proposed Budget:</span>
            <span className="text-zinc-300 font-semibold">${project.proposedBudget.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Quote Amount (USD)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-3 text-zinc-400 font-semibold text-sm">$</span>
              <input
                type="number"
                value={quoteAmount}
                onChange={(e) => setQuoteAmount(e.target.value)}
                placeholder={project.proposedBudget.toString()}
                min="0.01"
                step="0.01"
                required
                disabled={isPending}
                className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl pl-8 pr-4 py-2.5 text-sm text-zinc-200 outline-none transition-all"
                autoFocus
              />
            </div>
            {error && <p className="text-xs text-rose-400 font-semibold">{error}</p>}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-300 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="bg-violet-600 hover:bg-violet-500 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-violet-950/20"
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
