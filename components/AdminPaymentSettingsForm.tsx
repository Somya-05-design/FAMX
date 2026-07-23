"use client";

import { useState } from "react";
import { updateAdminPaymentSettingsAction } from "@/app/actions/payments";
import { AdminPaymentSettingsData } from "./PaymentSection";

interface AdminPaymentSettingsFormProps {
  initialSettings: AdminPaymentSettingsData;
}

export function AdminPaymentSettingsForm({ initialSettings }: AdminPaymentSettingsFormProps) {
  const [upiId, setUpiId] = useState(initialSettings.upiId || "");
  const [upiName, setUpiName] = useState(initialSettings.upiName || "");
  const [qrCodePath, setQrCodePath] = useState(initialSettings.qrCodePath || "");
  const [bankName, setBankName] = useState(initialSettings.bankName || "");
  const [accountName, setAccountName] = useState(initialSettings.accountName || "");
  const [accountNumber, setAccountNumber] = useState(initialSettings.accountNumber || "");
  const [ifscCode, setIfscCode] = useState(initialSettings.ifscCode || "");
  const [branchName, setBranchName] = useState(initialSettings.branchName || "");

  const [isPending, setIsPending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setStatusMsg("");

    setIsPending(true);
    try {
      await updateAdminPaymentSettingsAction({
        upiId,
        upiName,
        qrCodePath,
        bankName,
        accountName,
        accountNumber,
        ifscCode,
        branchName,
      });
      setStatusMsg("Payment settings updated successfully!");
    } catch (err: any) {
      setError(err.message || "Failed to update payment settings");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-surface-container-lowest border border-outline-variant p-6 rounded-3xl space-y-6 shadow-xs">
      <div>
        <h3 className="text-lg font-bold text-on-surface">Payment Methods & Barcode Configuration</h3>
        <p className="text-xs text-on-surface-variant mt-1">
          Configure the UPI ID, Custom Barcode QR Code, and Bank Details presented to clients when paying finalized project budgets.
        </p>
      </div>

      {/* UPI Section */}
      <div className="space-y-4 pt-2 border-t border-outline-variant/50">
        <h4 className="text-xs font-bold text-outline uppercase tracking-wider">UPI & Barcode (QR) Credentials</h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
              UPI ID (VPA) *
            </label>
            <input
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="e.g. agency@upi"
              required
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
              UPI MERCHANT / DISPLAY NAME
            </label>
            <input
              type="text"
              value={upiName}
              onChange={(e) => setUpiName(e.target.value)}
              placeholder="e.g. FAMX Media Agency"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
            CUSTOM BARCODE / QR CODE IMAGE URL (OPTIONAL)
          </label>
          <input
            type="text"
            value={qrCodePath}
            onChange={(e) => setQrCodePath(e.target.value)}
            placeholder="Image URL or Leave empty for auto-generated dynamic UPI Barcode"
            className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
          />
          <p className="text-[10px] text-on-surface-variant mt-1">
            If left empty, FAMX automatically generates a scannable UPI Barcode with the exact finalized amount embedded.
          </p>
        </div>
      </div>

      {/* Bank Transfer Section */}
      <div className="space-y-4 pt-4 border-t border-outline-variant/50">
        <h4 className="text-xs font-bold text-outline uppercase tracking-wider">Bank Transfer Details</h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
              BANK NAME
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
              ACCOUNT HOLDER NAME
            </label>
            <input
              type="text"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="e.g. FAMX Media Pvt Ltd"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
              ACCOUNT NUMBER
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder="e.g. 50200012345678"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-outline uppercase tracking-wider mb-1">
              IFSC CODE
            </label>
            <input
              type="text"
              value={ifscCode}
              onChange={(e) => setIfscCode(e.target.value)}
              placeholder="e.g. HDFC0001234"
              className="w-full bg-surface-container-low border border-outline-variant rounded-xl px-3.5 py-2 text-xs font-bold text-on-surface outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-error font-semibold">{error}</p>}
      {statusMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{statusMsg}</p>}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-6 py-2.5 bg-primary hover:bg-primary-container text-on-primary rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
        >
          {isPending && (
            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          )}
          <span>Save Payment Settings</span>
        </button>
      </div>
    </form>
  );
}
