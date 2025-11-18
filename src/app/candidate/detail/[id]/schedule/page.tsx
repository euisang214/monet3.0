"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityCalendar from "@/components/bookings/AvailabilityCalendar";
import { Card, Input, Button } from "@/components/ui/ui";
import type { TimeSlot } from "@/lib/shared/time-slot";
import dynamic from "next/dynamic";

// Dynamically import CheckoutClient to avoid SSR issues with Stripe
const CheckoutClient = dynamic(
  () => import("@/app/candidate/bookings/[id]/checkout/CheckoutClient"),
  { ssr: false }
);

export default function Schedule({ params }: { params: { id: string } }) {
  const [weeks, setWeeks] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [bookingData, setBookingData] = useState<{
    id: string;
    clientSecret: string;
    priceUSD: number;
  } | null>(null);
  const router = useRouter();

  const handleConfirm = async (slots: TimeSlot[]) => {
    if (slots.length === 0) {
      window.alert("Please select at least one available time slot.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/candidate/bookings/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ professionalId: params.id, slots, weeks }),
      });

      if (res.ok) {
        const data = await res.json();
        // Now we have clientSecret and paymentIntentId - show payment form
        setBookingData({
          id: data.id,
          clientSecret: data.clientSecret,
          priceUSD: data.priceUSD,
        });
        setShowPayment(true);
      } else {
        const error = await res.json();
        window.alert(`Failed to create booking: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to create booking request:", err);
      window.alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show payment form after booking is created
  if (showPayment && bookingData) {
    return (
      <div className="col" style={{ gap: 16 }}>
        <Card className="col" style={{ padding: 16, gap: 8 }}>
          <h3>Complete Your Payment</h3>
          <p>Your booking request has been created. Please complete the payment to send your request to the professional.</p>
          <p><strong>Price:</strong> ${((bookingData.priceUSD || 0) / 100).toFixed(2)}</p>
          <p className="text-muted">
            Payment will be held securely until the call is completed. The professional will only receive payment after providing feedback.
          </p>
        </Card>
        <CheckoutClient
          bookingId={bookingData.id}
          clientSecret={bookingData.clientSecret}
          booking={{ priceUSD: bookingData.priceUSD, startAt: new Date() }}
          errorMessage={null}
        />
        <Button
          variant="secondary"
          onClick={() => {
            setShowPayment(false);
            setBookingData(null);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  // Show availability calendar
  return (
    <div className="col" style={{ gap: 16 }}>
      <Card className="col" style={{ padding: 16, gap: 8 }}>
        <p>
          Select your availability for the next few weeks. We'll share these times with the professional,
          who will pick one that works for them. <strong>You'll be charged now to secure your booking request.</strong>
        </p>
        <p className="text-muted">
          Your payment will be held securely until the call is completed. The professional only receives payment after providing feedback.
        </p>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          <label htmlFor="weeks">Weeks to share:</label>
          <Input
            id="weeks"
            type="number"
            min={1}
            value={weeks}
            onChange={(e) => setWeeks(parseInt(e.target.value) || 1)}
            style={{ width: 80 }}
          />
        </div>
      </Card>
      <AvailabilityCalendar weeks={weeks} onConfirm={handleConfirm} disabled={isSubmitting} />
    </div>
  );
}
