"use client";

import { useState } from "react";
import { proposeBudgetAction, finalizeBudgetAction } from "@/app/actions/budget";

export interface BudgetHistoryItem {
  id: string;
  amount: number;
  proposedBy: "CLIENT" | "ADMIN";
  note: string | null;
  createdAt: string | Date;
}

interface BudgetNegotiatorProps {
  projectId: string;
  userRole: "CLIENT" | "ADMIN";
  currentProposedBudget: number;
  currentQuoteAmount: number | null;
  isBudgetFinalized: boolean;
  lastNegotiatedBy: "CLIENT" | "ADMIN" | null;
  history: BudgetHistoryItem[];
  onUpdated?: () => void;
}

export function BudgetNegotiator({
  projectId,
  userRole,
  currentProposedBudget,
  currentQuoteAmount,
  isBudgetFinalized,
  lastNegotiatedBy,
  history,
  onUpdated,
}: BudgetNegotiatorProps) {
  const [isCounterOpen, setIsCounterOpen] = useState(false);
  const [counterAmount, setCounterAmount] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const isClient = userRole === "CLIENT";
  const isAdmin = userRole === "ADMIN";

  const currentDisplayAmount = isBudgetFinalized
    ? (currentQuoteAmount || currentProposedBudget)
    : (isAdmin ? (currentQuoteAmount || currentProposedBudget) : currentProposedBudget);

  const handleProposeCounter = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const val = parseFloat(counterAmount);
    if (isNaN(val) || val <= 0) {
      setError("Please enter a valid counter-budget amount greater than 0");
      return;
    }

    setIsPending(true);
    try {
      await proposeBudgetAction(projectId, val, note);
      setIsCounterOpen(false);
      setCounterAmount("");
      setNote("");
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to submit counter offer");
    } finally {
      setIsPending(false);
    }
  };

  const handleFinalizeBudget = async () => {
    const finalVal = currentQuoteAmount || currentProposedBudget;
    if (!confirm(`Are you sure you want to finalize the budget at ₹${finalVal.toLocaleString("en-IN")}? Once finalized, the client will be asked to pay this amount.`)) {
      return;
    }

    setIsPending(true);
    try {
      await finalizeBudgetAction(projectId, finalVal);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      alert(err.message || "Failed to finalize budget");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl space-y-6 shadow-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/50 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-on-surface">Budget Negotiation Thread</h3>
            {isBudgetFinalized ? (
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full">
                Finalized by Admin
              </span>
            ) : (
              <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5 rounded-full">
                In Negotiation
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant mt-0.5">
            {isBudgetFinalized
              ? "The budget is locked and finalized. Payment request is active."
              : "Review counter-offers and negotiate a mutually feasible budget."}
          </p>
        </div>

        {/* Current Agreed / Quoted Box */}
        <div className="bg-surface-container-low px-4 py-2 rounded-2xl border border-outline-variant/60 flex items-center gap-3 shrink-0">
          <span className="text-xs text-on-surface-variant font-medium">Current Figure:</span>
          <span className="text-xl font-extrabold text-primary">
            ₹{currentDisplayAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Negotiation History Timeline */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-outline uppercase tracking-wider">
          Negotiation Rounds ({history.length})
        </h4>

        {history.length === 0 ? (
          <div className="text-xs text-on-surface-variant italic p-4 text-center bg-surface-container-low rounded-2xl">
            No negotiation history recorded yet.
          </div>
        ) : (
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {history.map((item, idx) => {
              const isSenderClient = item.proposedBy === "CLIENT";
              return (
                <div
                  key={item.id || idx}
                  className={`p-3.5 rounded-2xl border ${
                    isSenderClient
                      ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800/40"
                      : "bg-purple-50/50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                          isSenderClient
                            ? "bg-blue-500 text-white"
                            : "bg-purple-600 text-white"
                        }`}
                      >
                        {isSenderClient ? "Client Proposed" : "Admin Quoted"}
                      </span>
                      <span className="text-sm font-bold text-on-surface">
                        ₹{item.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <span className="text-[10px] text-on-surface-variant">
                      {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {item.note && (
                    <p className="text-xs text-on-surface-variant mt-2 italic pl-1 border-l-2 border-outline-variant">
                      "{item.note}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Counter Offer & Finalization Actions (If not finalized) */}
      {!isBudgetFinalized && (
        <div className="pt-2 border-t border-outline-variant/50 space-y-4">
          {!isCounterOpen ? (
            <div className="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setCounterAmount(currentDisplayAmount.toString());
                  setIsCounterOpen(true);
                }}
                disabled={isPending}
                className="px-4 py-2 bg-tertiary hover:bg-tertiary-container text-on-tertiary rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
              >
                Propose Counter Budget
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={handleFinalizeBudget}
                  disabled={isPending}
                  className="px-5 py-2 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  {isPending && (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Finalize Budget & Request Payment</span>
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleProposeCounter} className="bg-surface-container-low p-4 rounded-2xl border border-outline-variant space-y-4">
              <h5 className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Submit Counter Offer
              </h5>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
                    COUNTER AMOUNT (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-outline font-bold text-sm">₹</span>
                    <input
                      type="number"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      step="0.01"
                      required
                      className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl pl-7 pr-3 py-2 text-sm font-bold text-on-surface outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
                    REASON / NOTE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Scope adjustment request"
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                  />
                </div>
              </div>

              {error && <p className="text-xs text-error font-semibold">{error}</p>}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCounterOpen(false)}
                  disabled={isPending}
                  className="px-3.5 py-1.5 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-container text-on-primary rounded-lg text-xs font-bold flex items-center space-x-1"
                >
                  {isPending && (
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  <span>Submit Counter</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
