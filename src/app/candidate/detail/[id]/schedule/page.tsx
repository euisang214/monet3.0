"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityCalendar from "@/components/bookings/AvailabilityCalendar";
import { Card, Input, Button } from "@/components/ui/ui";
import type { TimeSlot } from "@/lib/shared/time-slot";

export default function Schedule({ params }: { params: { id: string } }) {
  const [weeks, setWeeks] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
        window.alert("Your booking request has been sent! The professional will review your availability and confirm a time.");
        router.push("/candidate/dashboard");
      } else {
        const error = await res.json();
        window.alert(`Failed to send booking request: ${error.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error("Failed to create booking request:", err);
      window.alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <Card className="col" style={{ padding: 16, gap: 8 }}>
        <p>
          Select your availability for the next few weeks. We'll share these times with the professional,
          who will pick one that works for them. You'll only be charged after they confirm the time.
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
