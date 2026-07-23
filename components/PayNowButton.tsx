"use client";

interface PayNowButtonProps {
  paymentId?: string;
}

export function PayNowButton({ paymentId }: PayNowButtonProps) {
  const handlePayClick = () => {
    // Scroll smoothly to the PaymentSection on page
    const element = document.getElementById("payment-section") || document.querySelector("[data-payment-section]");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <button
      onClick={handlePayClick}
      className="bg-primary hover:bg-primary-container text-on-primary font-bold text-[10px] px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 shrink-0 cursor-pointer shadow-xs"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
      <span>Pay via UPI / Barcode</span>
    </button>
  );
}
