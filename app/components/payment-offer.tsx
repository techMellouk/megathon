"use client";

import { useState } from "react";
import { Download, Loader2, Sparkles, Trophy } from "lucide-react";
import DisplayCards from "@/components/ui/display-cards";
import { PAYMENT_ID_KEY } from "@/lib/payments";
import { getErrorMessage } from "@/lib/utils";

type PaymentOfferProps = {
  modelUrl: string;
  prompt?: string;
};

type CreatePaymentResponse = {
  paymentId?: string;
  checkoutUrl?: string;
  error?: string;
};

export function PaymentOffer({ modelUrl, prompt }: PaymentOfferProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelUrl, prompt }),
      });

      let data: CreatePaymentResponse;
      try {
        data = (await response.json()) as CreatePaymentResponse;
      } catch {
        throw new Error(`Server error (${response.status})`);
      }

      if (!response.ok || !data.checkoutUrl || !data.paymentId) {
        throw new Error(data.error || "Could not start payment.");
      }

      sessionStorage.setItem(PAYMENT_ID_KEY, data.paymentId);
      sessionStorage.setItem("megathon_model_url", modelUrl);
      window.location.href = data.checkoutUrl;
    } catch (paymentError) {
      setError(getErrorMessage(paymentError, "Payment failed."));
      setLoading(false);
    }
  }

  return (
    <aside className="payment-offer" aria-label="Download payment offer">
      <DisplayCards
        cards={[
          {
            className:
              "[grid-area:stack] grayscale-100 hover:-translate-y-8 hover:grayscale-0 before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-xl before:bg-[#07080c]/50 before:content-[''] before:transition-opacity before:duration-700 hover:before:opacity-0",
            icon: <Sparkles className="size-4 text-blue-300" />,
            title: "Model ready",
            description: prompt ? prompt.slice(0, 42) + (prompt.length > 42 ? "…" : "") : "Your 3D model",
            date: "Preview unlocked",
          },
          {
            className:
              "[grid-area:stack] translate-x-10 translate-y-8 grayscale-100 hover:-translate-y-1 hover:grayscale-0 before:absolute before:left-0 before:top-0 before:h-full before:w-full before:rounded-xl before:bg-[#07080c]/50 before:content-[''] before:transition-opacity before:duration-700 hover:before:opacity-0",
            icon: <Download className="size-4 text-emerald-300" />,
            title: "Download file",
            description: "GLB export included",
            date: "Pay once to unlock",
          },
          {
            className: "[grid-area:stack] translate-x-20 translate-y-16 hover:translate-y-8",
            icon: loading ? (
              <Loader2 className="size-4 animate-spin text-amber-300" />
            ) : (
              <Trophy className="size-4 text-amber-300" />
            ),
            title: loading ? "Redirecting…" : "Pay & download",
            description: loading ? "Opening Mollie checkout" : "Tap to unlock your file",
            date: "Test payment",
            titleClassName: "text-amber-300",
            onClick: startPayment,
          },
        ]}
      />
      {error ? <p className="payment-offer-error">{error}</p> : null}
    </aside>
  );
}
