"use client";

import { useState } from "react";
import { ProjectStatus } from "@prisma/client";
import { updateProjectStatusAction, updateQuoteAmountAction, toggleDisputeAction } from "@/app/actions/projects";
import { requestPaymentAction } from "@/app/actions/payments";

interface AdminProjectManagerProps {
  projectId: string;
  initialStatus: ProjectStatus;
  initialQuoteAmount: number | null;
  initialIsDisputed: boolean;
  proposedBudget: number;
}

export function AdminProjectManager({
  projectId,
  initialStatus,
  initialQuoteAmount,
  initialIsDisputed,
  proposedBudget,
}: AdminProjectManagerProps) {
  const [status, setStatus] = useState<ProjectStatus>(initialStatus);
  const [quoteInput, setQuoteInput] = useState(initialQuoteAmount?.toString() || "");
  const [quoteAmount, setQuoteAmount] = useState<number | null>(initialQuoteAmount);
  const [isDisputed, setIsDisputed] = useState(initialIsDisputed);

  const [isStatusPending, setIsStatusPending] = useState(false);
  const [isQuotePending, setIsQuotePending] = useState(false);
  const [isDisputePending, setIsDisputePending] = useState(false);

  const [paymentAmountInput, setPaymentAmountInput] = useState(quoteAmount?.toString() || proposedBudget.toString());
  const [isPaymentPending, setIsPaymentPending] = useState(false);

  const handlePaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmountInput);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount to request");
      return;
    }

    setIsPaymentPending(true);
    try {
      await requestPaymentAction(projectId, amount);
      alert("Stripe Payment request generated successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create payment request");
    } finally {
      setIsPaymentPending(false);
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as ProjectStatus;
    setIsStatusPending(true);

    try {
      const result = await updateProjectStatusAction(projectId, newStatus);
      setStatus(result.status);
    } catch (err: any) {
      alert(err.message || "Failed to update project status");
      // Reset dropdown value
      e.target.value = status;
    } finally {
      setIsStatusPending(false);
    }
  };

  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(quoteInput);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid quote amount");
      return;
    }

    setIsQuotePending(true);
    try {
      const result = await updateQuoteAmountAction(projectId, amount);
      setQuoteAmount(result.quoteAmount ?? null);
      // If we quoted a SUBMITTED project, it automatically transitions to QUOTED
      if (status === ProjectStatus.SUBMITTED) {
        setStatus(ProjectStatus.QUOTED);
      }
      alert("Quote updated successfully");
    } catch (err: any) {
      alert(err.message || "Failed to update quote");
    } finally {
      setIsQuotePending(false);
    }
  };

  const handleDisputeToggle = async () => {
    setIsDisputePending(true);
    try {
      const result = await toggleDisputeAction(projectId, !isDisputed);
      setIsDisputed(result.isDisputed);
    } catch (err: any) {
      alert(err.message || "Failed to toggle dispute");
    } finally {
      setIsDisputePending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Status Dropdown */}
      <div className="bg-zinc-900/30 p-6 border border-zinc-800 rounded-2xl">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Project Status
        </label>
        <div className="relative">
          <select
            value={status}
            onChange={handleStatusChange}
            disabled={isStatusPending}
            className="w-full bg-zinc-950 border border-zinc-800 text-zinc-200 text-sm rounded-xl px-4 py-3 outline-none focus:border-violet-500 transition-all cursor-pointer appearance-none"
          >
            <option value={ProjectStatus.SUBMITTED}>Submitted</option>
            <option value={ProjectStatus.QUOTED}>Quoted</option>
            <option value={ProjectStatus.IN_PROGRESS}>In Progress</option>
            <option value={ProjectStatus.COMPLETED}>Completed</option>
            <option value={ProjectStatus.CANCELLED}>Cancelled</option>
          </select>
          <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-zinc-500">
            {isStatusPending ? (
              <span className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* 2. Set/Update Quote Form */}
      <div className="bg-zinc-900/30 p-6 border border-zinc-800 rounded-2xl">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          {quoteAmount ? "Update Quote" : "Set Binding Quote"}
        </label>
        <form onSubmit={handleQuoteSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-3 text-zinc-400 font-semibold text-sm">$</span>
            <input
              type="number"
              value={quoteInput}
              onChange={(e) => setQuoteInput(e.target.value)}
              placeholder={proposedBudget.toString()}
              min="1"
              step="0.01"
              disabled={isQuotePending}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl pl-8 pr-4 py-2.5 text-sm text-zinc-200 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isQuotePending}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/20 flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isQuotePending && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Apply</span>
          </button>
        </form>
      </div>

      {/* Request Payment Form */}
      <div className="bg-zinc-900/30 p-6 border border-zinc-800 rounded-2xl">
        <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
          Request Payment (Stripe Checkout)
        </label>
        <form onSubmit={handlePaymentRequest} className="flex gap-2">
          <div className="relative flex-1">
            <span className="absolute left-4 top-3 text-zinc-400 font-semibold text-sm">$</span>
            <input
              type="number"
              value={paymentAmountInput}
              onChange={(e) => setPaymentAmountInput(e.target.value)}
              placeholder={(quoteAmount || proposedBudget).toString()}
              min="1"
              step="0.01"
              disabled={isPaymentPending}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-violet-500 rounded-xl pl-8 pr-4 py-2.5 text-sm text-zinc-200 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isPaymentPending}
            className="bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-950/20 flex items-center space-x-1.5 shrink-0 cursor-pointer disabled:opacity-50"
          >
            {isPaymentPending && (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Invoice</span>
          </button>
        </form>
      </div>

      {/* 3. Dispute Toggle (Only available on COMPLETED projects) */}
      {status === ProjectStatus.COMPLETED && (
        <div className="bg-zinc-900/30 p-6 border border-zinc-800 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-zinc-200">Dispute Project</h4>
            <p className="text-[10px] text-zinc-500 mt-1">Flag project as active dispute for resolution.</p>
          </div>
          <button
            onClick={handleDisputeToggle}
            disabled={isDisputePending}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isDisputed
                ? "bg-rose-950 border border-rose-800 text-rose-400"
                : "bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-300"
            }`}
          >
            {isDisputePending ? "Updating..." : isDisputed ? "Disputed 🚩" : "Flag Dispute"}
          </button>
        </div>
      )}
    </div>
  );
}
