"use client";

import { useState } from "react";
import { getPaymentCheckoutUrlAction } from "@/app/actions/payments";

interface PayNowButtonProps {
  paymentId: string;
}

export function PayNowButton({ paymentId }: PayNowButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handlePay = async () => {
    setIsPending(true);
    try {
      const result = await getPaymentCheckoutUrlAction(paymentId);
      if (result?.url) {
        window.location.href = result.url;
      } else {
        alert("Failed to retrieve payment link");
      }
    } catch (err: any) {
      alert(err.message || "Failed to initiate payment");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={isPending}
      className="bg-primary hover:bg-primary-container text-on-primary font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 shrink-0 cursor-pointer disabled:opacity-50 shadow-xs"
    >
      {isPending ? (
        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )}
      <span>Pay Now</span>
    </button>
  );
}
