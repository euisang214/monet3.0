"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { Card, Button } from "../../../../../components/ui";
import { ProfessionalResponse } from "../types";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function CheckoutForm({
  professionalId,
  slots,
  weeks,
}: {
  professionalId: string;
  slots: any[];
  weeks: number;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

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
        body: JSON.stringify({ professionalId, slots, weeks }),
      });
      if (res.ok) {
        window.alert("Your booking request has been sent.");
        router.push("/candidate/dashboard");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="col" style={{ gap: 16 }}>
      <PaymentElement />
      <Button type="submit" disabled={!stripe}>
        Pay
      </Button>
    </form>
  );
}

export default function CheckoutPage({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const slots = JSON.parse(searchParams.get("slots") || "[]");
  const weeks = parseInt(searchParams.get("weeks") || "2");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pro, setPro] = useState<ProfessionalResponse | null>(null);

  useEffect(() => {
    fetch(`/api/professionals/${params.id}`).then(async (res) => {
      if (res.ok) {
        const data: ProfessionalResponse = await res.json();
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
        />
      </div>
    </Elements>
  );
}

