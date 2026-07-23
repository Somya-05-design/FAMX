import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Stripe payments have been replaced by direct UPI / Barcode / Bank Transfer in FAMX.",
  }, { status: 200 });
}
