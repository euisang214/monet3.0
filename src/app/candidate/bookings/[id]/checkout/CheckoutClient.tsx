"use client";

import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import type { Stripe } from "@stripe/stripe-js";

import { Card, Button } from "@/components/ui/ui";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const STRIPE_MISSING_KEY_MESSAGE =
  "Stripe is not configured for this environment. Please contact support.";

type CheckoutFormProps = {
  bookingId: string;
};

function CheckoutForm({ bookingId }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      window.alert("Payment form is not ready. Please try again in a moment.");
      console.error("[CheckoutForm] Attempted to submit payment but PaymentElement was unavailable.");
      return;
    }

    setIsSubmitting(true);

    try {
      console.debug("[CheckoutForm] Confirming payment intent via Stripe.js.");
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        console.error("[CheckoutForm] Payment confirmation returned an error.", error);
        window.alert(error.message || "Payment failed");
        return;
      }

      console.debug("[CheckoutForm] Payment intent status after confirmation.", {
        status: paymentIntent?.status,
        id: paymentIntent?.id,
      });

      if (paymentIntent?.status === "succeeded") {
        // Confirm payment on backend
        const res = await fetch("/api/shared/payments/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        if (res.ok) {
          console.debug("[CheckoutForm] Payment confirmed successfully.");
          window.alert("Payment successful! Your booking is confirmed.");
          router.push("/candidate/dashboard");
        } else {
          console.error("[CheckoutForm] Payment confirmation failed on backend.", {
            status: res.status,
            statusText: res.statusText,
          });
          window.alert("Payment succeeded but we were unable to confirm your booking. Please contact support.");
        }
      }
    } catch (err) {
      window.alert("An unexpected error occurred while processing the payment.");
      console.error("[CheckoutForm] Unexpected error while submitting payment.", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 16 }}>
      <PaymentElement
        onReady={() => {
          console.debug("[CheckoutForm] PaymentElement has finished mounting.");
          setIsPaymentElementReady(true);
        }}
        onLoadError={(event) => {
          console.error("[CheckoutForm] PaymentElement failed to load.", event?.error);
          if (event?.error?.message) {
            window.alert(event.error.message);
          }
        }}
      />
      <Button type="submit" disabled={!stripe || !isPaymentElementReady || isSubmitting}>
        {isSubmitting ? "Processing..." : "Pay"}
      </Button>
    </form>
  );
}

type CheckoutClientProps = {
  bookingId: string;
  clientSecret: string | null;
  booking: any | null;
  errorMessage?: string | null;
};

export default function CheckoutClient({
  bookingId,
  clientSecret,
  booking,
  errorMessage,
}: CheckoutClientProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);

  const hasBooking = Boolean(booking);

  useEffect(() => {
    console.debug("[CheckoutClient] Rendering with props", {
      hasBooking,
      clientSecretPresent: Boolean(clientSecret),
      bookingId,
    });
  }, [hasBooking, clientSecret, bookingId]);

  useEffect(() => {
    let isMounted = true;

    if (!clientSecret) {
      console.warn("[CheckoutClient] No client secret was provided. Skipping Stripe initialization.");
      setStripe(null);
      setStripeError(null);
      setIsLoadingStripe(false);
      return () => {
        isMounted = false;
      };
    }

    if (!publishableKey) {
      console.error("[CheckoutClient] NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set.");
      if (isMounted) {
        setStripeError(STRIPE_MISSING_KEY_MESSAGE);
        setStripe(null);
        setIsLoadingStripe(false);
      }
      return () => {
        isMounted = false;
      };
    }

    setIsLoadingStripe(true);
    setStripeError(null);
    setStripe(null);
    console.debug("[CheckoutClient] Loading Stripe.js library.");

    loadStripe(publishableKey)
      .then((loadedStripe) => {
        if (!isMounted) return;

        if (!loadedStripe) {
          console.error("[CheckoutClient] Stripe.js failed to load. Invalid publishable key?");
          setStripeError(
            "We were unable to initialize the payment form. Please refresh and try again."
          );
          setStripe(null);
          return;
        }

        console.debug("[CheckoutClient] Stripe.js loaded successfully.");
        setStripe(loadedStripe);
      })
      .catch((error) => {
        if (!isMounted) return;
        console.error("[CheckoutClient] Failed to load Stripe.js.", error);
        setStripeError(
          "We were unable to initialize the payment form. Please refresh and try again."
        );
        setStripe(null);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingStripe(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [clientSecret, publishableKey]);

  useEffect(() => {
    if (stripe) {
      console.debug("[CheckoutClient] Stripe.js is ready and Elements can mount.");
    }
  }, [stripe]);

  const summaryCard = booking ? (
    <Card className="col" style={{ padding: 16, gap: 8 }}>
      <h3>Booking Summary</h3>
      <p>
        Your call has been scheduled for{" "}
        {new Date(booking.startAt).toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })}
      </p>
      <p>Duration: 30 minutes</p>
      <p>Price: ${booking.priceUSD?.toFixed(2)}</p>
      <p className="text-muted">
        The professional will only be paid once they provide feedback after the call.
      </p>
    </Card>
  ) : null;

  const renderLayout = (content: ReactNode) => (
    <div className="col" style={{ gap: 16 }}>
      {summaryCard}
      {content}
    </div>
  );

  if (!clientSecret) {
    return renderLayout(
      <Card className="col" style={{ padding: 16, gap: 8 }}>
        <p>{errorMessage ?? "We were unable to load the payment form. Please refresh and try again."}</p>
      </Card>
    );
  }

  if (stripeError) {
    return renderLayout(
      <Card className="col" style={{ padding: 16, gap: 8 }}>
        <p>{stripeError}</p>
      </Card>
    );
  }

  if (isLoadingStripe || !stripe) {
    return renderLayout(
      <Card className="col" style={{ padding: 16, gap: 8 }}>
        <p>Loading payment form...</p>
      </Card>
    );
  }

  return (
    <Elements stripe={stripe} options={{ clientSecret }}>
      {renderLayout(<CheckoutForm bookingId={bookingId} />)}
    </Elements>
  );
}
