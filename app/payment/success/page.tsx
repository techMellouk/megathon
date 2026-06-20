"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Download, Flag, Loader2, XCircle } from "lucide-react";
import { PAYMENT_ID_KEY } from "@/lib/payments";
import { createRaceSession } from "@/lib/raceSession";
import { getErrorMessage } from "@/lib/utils";

type VerifyResponse = {
  paid?: boolean;
  status?: string;
  modelId?: string;
  downloadUrl?: string;
  format?: string;
  prompt?: string | null;
  error?: string;
};

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [state, setState] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [message, setMessage] = useState("Verifying your payment…");
  const [raceUrl, setRaceUrl] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const paymentId =
        params.get("paymentId") ||
        params.get("id") ||
        sessionStorage.getItem(PAYMENT_ID_KEY);

      if (!paymentId) {
        setState("error");
        setMessage("No payment reference found. Start checkout from your generated car.");
        return;
      }

      try {
        const response = await fetch(
          `/api/payments/verify?paymentId=${encodeURIComponent(paymentId)}`,
        );
        const result = (await response.json()) as VerifyResponse;

        if (!response.ok) {
          throw new Error(result.error || "Verification failed.");
        }

        setData(result);

        if (result.paid && result.modelId) {
          setState("paid");
          setMessage("Payment confirmed. Your car is heading to the grid…");
          sessionStorage.removeItem(PAYMENT_ID_KEY);
          const session = createRaceSession({
            modelId: result.modelId,
            paymentId,
            paid: true,
          });
          setRaceUrl(
            `/race/${session.raceSessionId}?modelId=${encodeURIComponent(result.modelId)}`,
          );
          return;
        }

        setState("pending");
        setMessage(
          result.status === "open" || result.status === "pending"
            ? "Payment not completed yet. Finish checkout in Mollie or try again."
            : `Payment status: ${result.status ?? "unknown"}.`,
        );
      } catch (error) {
        setState("error");
        setMessage(getErrorMessage(error, "Could not verify payment."));
      }
    }

    void verify();
  }, []);

  // Auto-launch the race shortly after a successful payment.
  useEffect(() => {
    if (state !== "paid" || !raceUrl || startedRef.current) return;
    startedRef.current = true;
    const t = setTimeout(() => router.push(raceUrl), 2200);
    return () => clearTimeout(t);
  }, [state, raceUrl, router]);

  const downloadUrl = data?.downloadUrl;
  const format = (data?.format ?? "glb").toUpperCase();

  return (
    <main className="payment-success-screen gradient-bg">
      <div className="payment-success-card">
        {state === "loading" ? (
          <Loader2 className="payment-success-icon spin-icon" />
        ) : state === "paid" ? (
          <CheckCircle2 className="payment-success-icon text-emerald-400" />
        ) : (
          <XCircle className="payment-success-icon text-amber-400" />
        )}

        <h1 className="payment-success-title">
          {state === "paid"
            ? "You're in the race"
            : state === "loading"
              ? "Checking payment"
              : "Payment pending"}
        </h1>
        <p className="payment-success-message">{message}</p>

        {data?.prompt ? (
          <p className="payment-success-prompt">&ldquo;{data.prompt}&rdquo;</p>
        ) : null}

        {state === "paid" && raceUrl ? (
          <div className="payment-success-actions">
            <button
              className="payment-download-button"
              onClick={() => router.push(raceUrl)}
              type="button"
            >
              <Flag size={18} />
              Start the race
            </button>
            {downloadUrl ? (
              <a className="payment-back-link" href={downloadUrl} download>
                <Download size={15} /> Or download the {format} file
              </a>
            ) : null}
          </div>
        ) : null}

        <Link className="payment-back-link" href="/">
          Back to studio
        </Link>
      </div>
    </main>
  );
}
