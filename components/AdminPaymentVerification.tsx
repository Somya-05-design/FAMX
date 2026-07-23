"use client";

import { useState } from "react";
import { verifyPaymentAction } from "@/app/actions/payments";
import { PaymentStatus } from "@prisma/client";

export interface PaymentRecord {
  id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: string | null;
  utrNumber?: string | null;
  receiptPath?: string | null;
  rejectionReason?: string | null;
  createdAt: string | Date;
}

interface AdminPaymentVerificationProps {
  payment: PaymentRecord;
  onUpdated?: () => void;
}

export function AdminPaymentVerification({ payment, onUpdated }: AdminPaymentVerificationProps) {
  const [isPending, setIsPending] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  const handleApprove = async () => {
    if (!confirm(`Confirm approval of payment of ₹${payment.amount.toLocaleString("en-IN")}? This will set project status to IN_PROGRESS.`)) {
      return;
    }

    setIsPending(true);
    try {
      await verifyPaymentAction(payment.id, "APPROVE");
      if (onUpdated) onUpdated();
    } catch (err: any) {
      alert(err.message || "Failed to approve payment");
    } finally {
      setIsPending(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!rejectionReason.trim()) {
      setError("Please specify a rejection reason for the client");
      return;
    }

    setIsPending(true);
    try {
      await verifyPaymentAction(payment.id, "REJECT", rejectionReason.trim());
      setShowRejectModal(false);
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to reject payment");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl space-y-4 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-outline-variant/50 pb-3">
        <div>
          <h4 className="text-base font-bold text-on-surface">Payment Verification Panel</h4>
          <p className="text-xs text-on-surface-variant">Review submitted client payment details and UTR number.</p>
        </div>
        <span className="text-sm font-extrabold text-primary">
          ₹{payment.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/50">
          <span className="text-[10px] text-outline font-bold uppercase block">Payment Method</span>
          <span className="font-bold text-on-surface">{payment.paymentMethod || "N/A"}</span>
        </div>
        <div className="bg-surface-container-low p-3 rounded-xl border border-outline-variant/50">
          <span className="text-[10px] text-outline font-bold uppercase block">UTR / Reference No</span>
          <span className="font-bold text-primary text-sm">{payment.utrNumber || "Not Provided"}</span>
        </div>
      </div>

      {payment.receiptPath && (
        <div className="p-3 bg-surface-container-low rounded-xl border border-outline-variant/50 space-y-1">
          <span className="text-[10px] text-outline font-bold uppercase block">Receipt Proof</span>
          <a
            href={payment.receiptPath}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-bold text-primary underline truncate block"
          >
            View Receipt Attachment ({payment.receiptPath})
          </a>
        </div>
      )}

      {/* Action Buttons */}
      {payment.status === "PENDING_VERIFICATION" && (
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            disabled={isPending}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Reject Payment Proof
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isPending}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer shadow-xs"
          >
            {isPending && (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            <span>Approve & Start Project</span>
          </button>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-dim/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl space-y-4">
            <h4 className="text-lg font-bold text-on-surface">Reject Payment Proof</h4>
            <p className="text-xs text-on-surface-variant">
              Specify the reason why this payment proof is invalid (e.g. invalid UTR, incorrect amount).
            </p>

            <form onSubmit={handleReject} className="space-y-4">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter rejection explanation for client..."
                required
                rows={3}
                className="w-full bg-surface-container-low border border-outline-variant rounded-xl p-3 text-xs text-on-surface outline-none focus:border-rose-500"
              />

              {error && <p className="text-xs text-error font-semibold">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  disabled={isPending}
                  className="px-4 py-2 bg-surface-container text-on-surface rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
