"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, Download, Loader2, XCircle } from "lucide-react";
import { PAYMENT_ID_KEY } from "@/lib/payments";
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
  const [state, setState] = useState<"loading" | "paid" | "pending" | "error">("loading");
  const [data, setData] = useState<VerifyResponse | null>(null);
  const [message, setMessage] = useState("Verifying your payment…");

  useEffect(() => {
    async function verify() {
      const params = new URLSearchParams(window.location.search);
      const paymentId =
        params.get("paymentId") ||
        params.get("id") ||
        sessionStorage.getItem(PAYMENT_ID_KEY);

      if (!paymentId) {
        setState("error");
        setMessage("No payment reference found. Start checkout from your generated model.");
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

        if (result.paid) {
          setState("paid");
          setMessage("Payment successful. Your download is ready.");
          sessionStorage.removeItem(PAYMENT_ID_KEY);
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
          {state === "paid" ? "Payment successful" : state === "loading" ? "Checking payment" : "Payment pending"}
        </h1>
        <p className="payment-success-message">{message}</p>

        {data?.prompt ? (
          <p className="payment-success-prompt">&ldquo;{data.prompt}&rdquo;</p>
        ) : null}

        {state === "paid" && downloadUrl ? (
          <div className="payment-success-actions">
            <a className="payment-download-button" href={downloadUrl} download>
              <Download size={18} />
              Download {format}
            </a>
            <p className="payment-success-note">
              WaveSpeed exports GLB models. STL conversion is not included in this test flow yet.
            </p>
          </div>
        ) : null}

        <Link className="payment-back-link" href="/">
          Back to Mesh Studio
        </Link>
      </div>
    </main>
  );
}
