"use client";

import { useState } from "react";
import { submitPaymentProofAction } from "@/app/actions/payments";
import { PaymentMethod, PaymentStatus } from "@prisma/client";

export interface PaymentData {
  id: string;
  amount: number;
  status: PaymentStatus;
  paymentMethod?: PaymentMethod | null;
  utrNumber?: string | null;
  receiptPath?: string | null;
  rejectionReason?: string | null;
}

export interface AdminPaymentSettingsData {
  upiId?: string | null;
  upiName?: string | null;
  qrCodePath?: string | null;
  bankName?: string | null;
  accountName?: string | null;
  accountNumber?: string | null;
  ifscCode?: string | null;
  branchName?: string | null;
}

interface PaymentSectionProps {
  projectId: string;
  payment: PaymentData;
  settings: AdminPaymentSettingsData;
  userRole: "CLIENT" | "ADMIN";
  onUpdated?: () => void;
}

export function PaymentSection({
  projectId,
  payment,
  settings,
  userRole,
  onUpdated,
}: PaymentSectionProps) {
  const [activeTab, setActiveTab] = useState<"QR" | "UPI" | "BANK">("QR");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("UPI_QR");
  const [utrNumber, setUtrNumber] = useState(payment.utrNumber || "");
  const [receiptPath, setReceiptPath] = useState(payment.receiptPath || "");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formattedAmount = payment.amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const upiId = settings.upiId || "agency@upi";
  const upiName = settings.upiName || "FAMX Agency";
  
  // Dynamic UPI URI string for generating QR Code or scannable intent
  const upiUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(upiName)}&am=${payment.amount}&cu=INR`;
  // Online QR generator service URL for exact UPI barcode image
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUri)}`;
  const qrImageSource = settings.qrCodePath || dynamicQrUrl;

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!utrNumber || utrNumber.trim().length < 4) {
      setError("Please enter a valid Transaction Reference / UTR Number");
      return;
    }

    setIsPending(true);
    try {
      await submitPaymentProofAction({
        paymentId: payment.id,
        paymentMethod: selectedMethod,
        utrNumber: utrNumber.trim(),
        receiptPath: receiptPath ? receiptPath.trim() : undefined,
      });
      setSuccessMsg("Payment proof submitted successfully! Pending admin verification.");
      if (onUpdated) onUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to submit payment proof");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl space-y-6 shadow-xs">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-tertiary/10 to-surface-container-low p-5 rounded-2xl border border-primary/20">
        <div>
          <span className="text-[10px] font-extrabold text-primary uppercase tracking-widest block">
            Payment Action Required
          </span>
          <h3 className="text-xl font-extrabold text-on-surface tracking-tight mt-0.5">
            Pay Agreed Amount: <span className="text-primary">₹{formattedAmount}</span>
          </h3>
          <p className="text-xs text-on-surface-variant mt-1">
            Choose your preferred payment method below (Barcode, UPI ID, or Bank Transfer) and submit the UTR / Ref No.
          </p>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {payment.status === "PENDING" && (
            <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Pending Payment
            </span>
          )}
          {payment.status === "PENDING_VERIFICATION" && (
            <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Proof Under Review
            </span>
          )}
          {payment.status === "REJECTED" && (
            <span className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              Proof Rejected - Please Resubmit
            </span>
          )}
          {payment.status === "SUCCEEDED" && (
            <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Payment Verified & Paid
            </span>
          )}
        </div>
      </div>

      {/* Rejection Alert if applicable */}
      {payment.status === "REJECTED" && payment.rejectionReason && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-2xl space-y-1">
          <p className="text-xs font-bold text-rose-700 dark:text-rose-300">
            Previous Payment Proof Rejected by Admin
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400 italic">
            Reason: "{payment.rejectionReason}"
          </p>
          <p className="text-[11px] text-on-surface-variant pt-1">
            Please re-check your UTR reference number or upload a clear payment receipt below.
          </p>
        </div>
      )}

      {/* Payment Tabs: Barcode QR / UPI ID / Bank Transfer */}
      <div className="space-y-4">
        <div className="flex border-b border-outline-variant/60">
          <button
            type="button"
            onClick={() => { setActiveTab("QR"); setSelectedMethod("UPI_QR"); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "QR"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            📱 Barcode / UPI QR
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("UPI"); setSelectedMethod("UPI_ID"); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "UPI"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            💳 UPI ID
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab("BANK"); setSelectedMethod("BANK_TRANSFER"); }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === "BANK"
                ? "border-primary text-primary"
                : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}
          >
            🏛️ Bank Transfer
          </button>
        </div>

        {/* Tab Content 1: QR CODE / BARCODE */}
        {activeTab === "QR" && (
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/60 flex flex-col items-center justify-center text-center space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-md">
              <img
                src={qrImageSource}
                alt="Payment Barcode QR Code"
                className="w-56 h-56 object-contain rounded-lg"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface">
                Scan with any UPI App (GPay, PhonePe, Paytm, BHIM)
              </p>
              <p className="text-xs text-primary font-extrabold mt-1">
                Exact Amount to Pay: ₹{formattedAmount}
              </p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                UPI ID: {upiId} ({upiName})
              </p>
            </div>
          </div>
        )}

        {/* Tab Content 2: UPI ID */}
        {activeTab === "UPI" && (
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/60 space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-bold text-outline uppercase tracking-wider">
                ADMIN UPI ID
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={upiId}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface outline-none"
                />
                <button
                  type="button"
                  onClick={() => copyToClipboard(upiId, "upiId")}
                  className="px-4 py-2.5 bg-primary text-on-primary rounded-xl text-xs font-bold hover:bg-primary-container shrink-0 cursor-pointer"
                >
                  {copiedField === "upiId" ? "Copied! ✓" : "Copy UPI ID"}
                </button>
              </div>
            </div>

            <div className="p-3 bg-surface-container-lowest rounded-xl text-xs text-on-surface-variant border border-outline-variant/40">
              <span className="font-semibold text-on-surface">Payee Name:</span> {upiName}
              <br />
              <span className="font-semibold text-on-surface">Amount:</span> ₹{formattedAmount}
            </div>
          </div>
        )}

        {/* Tab Content 3: BANK TRANSFER */}
        {activeTab === "BANK" && (
          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/60 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40">
                <span className="text-[10px] text-outline font-bold uppercase block">Bank Name</span>
                <span className="text-sm font-bold text-on-surface">{settings.bankName || "HDFC Bank"}</span>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40">
                <span className="text-[10px] text-outline font-bold uppercase block">Account Holder Name</span>
                <span className="text-sm font-bold text-on-surface">{settings.accountName || "FAMX Agency"}</span>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 relative">
                <span className="text-[10px] text-outline font-bold uppercase block">Account Number</span>
                <span className="text-sm font-bold text-on-surface">{settings.accountNumber || "50200012345678"}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(settings.accountNumber || "50200012345678", "acct")}
                  className="absolute right-2 top-3 text-[10px] font-bold text-primary hover:underline"
                >
                  {copiedField === "acct" ? "Copied!" : "Copy"}
                </button>
              </div>
              <div className="bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/40 relative">
                <span className="text-[10px] text-outline font-bold uppercase block">IFSC Code</span>
                <span className="text-sm font-bold text-on-surface">{settings.ifscCode || "HDFC0001234"}</span>
                <button
                  type="button"
                  onClick={() => copyToClipboard(settings.ifscCode || "HDFC0001234", "ifsc")}
                  className="absolute right-2 top-3 text-[10px] font-bold text-primary hover:underline"
                >
                  {copiedField === "ifsc" ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Proof Submission Form (For Client or Admin reference) */}
      {userRole === "CLIENT" && payment.status !== "SUCCEEDED" && (
        <form onSubmit={handleSubmitProof} className="pt-4 border-t border-outline-variant/60 space-y-4">
          <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider">
            Step 2: Submit Payment Details / UTR Number
          </h4>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
                TRANSACTION REFERENCE / UTR NUMBER *
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 123456789012 or UPI/23423..."
                required
                disabled={isPending}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2.5 text-sm font-bold text-on-surface outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
                PAYMENT RECEIPT SCREENSHOT URL / ATTACHMENT PATH (OPTIONAL)
              </label>
              <input
                type="text"
                value={receiptPath}
                onChange={(e) => setReceiptPath(e.target.value)}
                placeholder="Paste uploaded image URL or filename"
                disabled={isPending}
                className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-2 text-xs text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>

          {error && <p className="text-xs text-error font-semibold">{error}</p>}
          {successMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{successMsg}</p>}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer shadow-xs"
            >
              {isPending && (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Submit Payment Proof for Verification</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
