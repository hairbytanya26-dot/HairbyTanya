// Wraps SumUp's Online Payments API (Hosted Checkout) — creates a checkout
// that the customer is redirected to on SumUp's own payment page, then lets
// us verify the final payment status server-side once they're redirected back.
//
// Requires SUMUP_API_KEY (from SumUp Dashboard -> Developer Settings -> API keys)
// and SUMUP_MERCHANT_CODE (your SumUp merchant code) in environment variables.

const SUMUP_API_BASE = "https://api.sumup.com/v0.1";

export async function createSumUpCheckout({
  amount,
  reference,
  redirectUrl,
  description,
}: {
  amount: number;
  reference: string;
  redirectUrl: string;
  description: string;
}): Promise<{ checkoutId: string; hostedCheckoutUrl: string }> {
  const res = await fetch(`${SUMUP_API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SUMUP_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      checkout_reference: reference,
      amount,
      currency: "EUR",
      merchant_code: process.env.SUMUP_MERCHANT_CODE,
      description,
      redirect_url: redirectUrl,
      hosted_checkout: { enabled: true },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`SumUp checkout creation failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const hostedUrl = data.hosted_checkout_url || data.hostedCheckoutUrl;
  if (!hostedUrl) {
    throw new Error("SumUp did not return a hosted checkout URL.");
  }

  return { checkoutId: data.id, hostedCheckoutUrl: hostedUrl };
}

export async function getSumUpCheckoutStatus(checkoutId: string): Promise<{
  status: string;
  isPaid: boolean;
}> {
  const res = await fetch(`${SUMUP_API_BASE}/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${process.env.SUMUP_API_KEY}` },
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`SumUp checkout status check failed (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  return { status: data.status, isPaid: data.status === "PAID" };
}
