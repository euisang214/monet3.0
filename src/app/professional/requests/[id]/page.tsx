"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityCalendar from "@/components/bookings/AvailabilityCalendar";
import type { TimeSlot } from "@/lib/shared/availability";
import { toUtcDateRange, resolveTimezone } from "@/lib/shared/availability";

export default function RequestSchedule({ params }: { params: { id: string } }) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/professional/bookings/${params.id}/view-availabilities`)
      .then((res) => res.json())
      .then((data) => {
        const availability: TimeSlot[] = (data.availability || []).map((s: any) => ({
          start: s.start,
          end: s.end,
          timezone: resolveTimezone(typeof s.timezone === "string" ? s.timezone : undefined),
        }));
        setSlots(availability);
      });
  }, [params.id]);

  const handleConfirm = async (selected: TimeSlot[]) => {
    if (!selected[0]) return;
    await fetch(`/api/professional/bookings/${params.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: toUtcDateRange(selected[0]).start.toISOString() }),
    });
    router.push("/professional/requests");
  };

  return (
    <div className="col" style={{ gap: 16 }}>
      <p>Please choose from the blue cells below.</p>
      <AvailabilityCalendar
        mode="select"
        slots={slots}
        onConfirm={handleConfirm}
        confirmText="Confirm Booking"
      />
    </div>
  );
}
