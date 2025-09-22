"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Card, Button } from "../../../../../../components/ui";
import { ProfileResponse } from "../../../../../../types/profile";
import {
  TimeSlot,
  normalizeSlots,
  convertTimeSlotsTimezone,
  getDefaultTimezone,
} from "../../../../../../../lib/availability";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function CheckoutForm({
  professionalId,
  slots,
  weeks,
  candidateTimezone,
}: {
  professionalId: string;
  slots: TimeSlot[];
  weeks: number;
  candidateTimezone: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false);

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
        const normalizedSlots = convertTimeSlotsTimezone(slots, candidateTimezone);
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

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const fallbackTimezone = useMemo(() => getDefaultTimezone(), []);

  const slotsParam = searchParams.get("slots");
  const slots: TimeSlot[] = useMemo(() => {
    if (!slotsParam) return [];
    try {
      const parsed = JSON.parse(slotsParam);
      if (!Array.isArray(parsed)) return [];
      return normalizeSlots(parsed, fallbackTimezone);
    } catch {
      return [];
    }
  }, [slotsParam, fallbackTimezone]);
  const weeks = parseInt(searchParams.get("weeks") || "2");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pro, setPro] = useState<ProfileResponse | null>(null);

  useEffect(() => {
    fetch(`/api/professionals/${params.id}`).then(async (res) => {
      if (res.ok) {
        const data: ProfileResponse = await res.json();
        setPro(data);
      }
    });
  }, [params.id]);

  useEffect(() => {
    fetch("/api/stripe/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId: params.id }),
    })
      .then((res) => res.json())
      .then((data) => setClientSecret(data.clientSecret));
  }, [params.id]);

  if (!clientSecret) return <p>Loading...</p>;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <div className="col" style={{ gap: 16 }}>
        {pro && (
          <Card className="col" style={{ padding: 16, gap: 8 }}>
            <p>
              You are booking a 30 minute chat with {pro.title} at {pro.employer}.
            </p>
            <p>The professional will only be paid once they provide feedback.</p>
          </Card>
        )}
        <CheckoutForm
          professionalId={params.id}
          slots={slots}
          weeks={weeks}
          candidateTimezone={fallbackTimezone}
        />
      </div>
    </Elements>
  );
}

