export async function confirmPaymentIntent(paymentIntentId: string) {
  const res = await fetch('/api/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ paymentIntentId }),
  });
  if (!res.ok) {
    let message = 'confirmation_failed';
    try {
      const err = await res.json();
      if (err?.error) message = err.error;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }
  return res.json() as Promise<{ ok: true; bookingId: string }>;
}
