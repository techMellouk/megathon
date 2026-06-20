import { Client } from "mollie-api-typescript";

export function getAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");
}

export function getMollieClient() {
  const apiKey = process.env.MOLLIE_API_KEY?.trim();

  if (!apiKey) {
    throw new Error("MOLLIE_API_KEY is not configured on the server.");
  }

  // test_ / live_ keys already imply mode — do not pass testmode (causes 400 Invalid Authorization)
  return new Client({
    security: { apiKey },
  });
}

export function getPaymentAmount() {
  const value = process.env.MOLLIE_PAYMENT_AMOUNT || "1.00";
  const currency = process.env.MOLLIE_PAYMENT_CURRENCY || "EUR";
  return { currency, value };
}

export function modelIdFromUrl(modelUrl: string) {
  const match = modelUrl.match(/\/api\/models\/([^/?#]+)$/);
  return match?.[1] ?? null;
}
