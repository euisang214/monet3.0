"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";

import { Card, Button } from "../../../../../../components/ui";
import type { ProfileResponse } from "../../../../../../types/profile";
import type { TimeSlot } from "../../../../../../../lib/availability";
import { convertTimeSlotsTimezone } from "../../../../../../../lib/availability";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const paymentElement = elements.getElement(PaymentElement);
    if (!paymentElement) {
      window.alert("Payment form is not ready. Please try again in a moment.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        window.alert(error.message || "Payment failed");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const res = await fetch("/api/bookings/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ professionalId, slots: normalizedSlots, weeks }),
        });

        if (res.ok) {
          window.alert("Your booking request has been sent.");
          router.push("/candidate/dashboard");
        }
      }
    } catch (err) {
      window.alert("An unexpected error occurred while processing the payment.");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 16 }}>
      <PaymentElement onReady={() => setIsPaymentElementReady(true)} />
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
  const summaryCard = professional ? (
    <Card className="col" style={{ padding: 16, gap: 8 }}>
      <p>
        You are booking a 30 minute chat with {professional.title} at {professional.employer}.
      </p>
      <p>The professional will only be paid once they provide feedback.</p>
    </Card>
  ) : null;

  if (!clientSecret) {
    return (
      <div className="col" style={{ gap: 16 }}>
        {summaryCard}
        <Card className="col" style={{ padding: 16, gap: 8 }}>
          <p>{errorMessage ?? "We were unable to load the payment form. Please refresh and try again."}</p>
        </Card>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <div className="col" style={{ gap: 16 }}>
        {summaryCard}
        <CheckoutForm
          professionalId={professionalId}
          slots={slots}
          weeks={weeks}
          candidateTimezone={candidateTimezone}
        />
      </div>
    </Elements>
  );
}
