"use client";

import { useEffect, useMemo, useState } from "react";
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

import { Card, Button } from "../../../../../../components/ui";
import type { ProfileResponse } from "../../../../../../types/profile";
import type { TimeSlot } from "../../../../../../../lib/availability";
import { convertTimeSlotsTimezone } from "../../../../../../../lib/availability";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
const STRIPE_MISSING_KEY_MESSAGE =
  "Stripe is not configured for this environment. Please contact support.";

type CheckoutFormProps = {
  professionalId: string;
  slots: TimeSlot[];
  weeks: number;
  candidateTimezone: string;
};

function CheckoutForm({
  professionalId,
  slots,
  weeks,
  candidateTimezone,
}: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

  const normalizedSlots = useMemo(
    () => convertTimeSlotsTimezone(slots, candidateTimezone),
    [slots, candidateTimezone]
  );

  useEffect(() => {
    if (slots.length === 0) {
      console.debug("[CheckoutForm] No slots selected when initializing checkout form.");
    } else {
      console.debug("[CheckoutForm] Normalized slots computed for checkout form.", {
        slotsCount: normalizedSlots.length,
      });
    }
  }, [normalizedSlots, slots.length]);

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
        const res = await fetch("/api/bookings/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professionalId, slots: normalizedSlots, weeks }),
        });

        if (res.ok) {
          console.debug("[CheckoutForm] Booking request created successfully.");
          window.alert("Your booking request has been sent.");
          router.push("/candidate/dashboard");
        } else {
          console.error("[CheckoutForm] Booking request failed after successful payment.", {
            status: res.status,
            statusText: res.statusText,
          });
          window.alert("Payment succeeded but we were unable to request the booking. Please contact support.");
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
  professionalId: string;
  clientSecret: string | null;
  professional: ProfileResponse | null;
  slots: TimeSlot[];
  weeks: number;
  candidateTimezone: string;
  errorMessage?: string | null;
};

export default function CheckoutClient({
  professionalId,
  clientSecret,
  professional,
  slots,
  weeks,
  candidateTimezone,
  errorMessage,
}: CheckoutClientProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [isLoadingStripe, setIsLoadingStripe] = useState(false);

  const hasProfessional = Boolean(professional);
  const slotsCount = slots.length;

  useEffect(() => {
    console.debug("[CheckoutClient] Rendering with props", {
      hasProfessional,
      clientSecretPresent: Boolean(clientSecret),
      slotsCount,
      weeks,
      candidateTimezone,
    });
  }, [hasProfessional, clientSecret, slotsCount, weeks, candidateTimezone]);

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

  const summaryCard = professional ? (
    <Card className="col" style={{ padding: 16, gap: 8 }}>
      <p>
        You are booking a 30 minute chat with {professional.title} at {professional.employer}.
      </p>
      <p>The professional will only be paid once they provide feedback.</p>
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
      {renderLayout(
        <CheckoutForm
          professionalId={professionalId}
          slots={slots}
          weeks={weeks}
          candidateTimezone={candidateTimezone}
        />
      )}
    </Elements>
  );
}
