"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AvailabilityCalendar, { Slot } from "../../../../components/AvailabilityCalendar";

export default function RequestSchedule({ params }: { params: { id: string } }) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/bookings/${params.id}/accept`, { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        const availability: Slot[] = (data.availability || []).map((s: any) => ({
          start: s.startAt,
          end: s.endAt,
        }));
        setSlots(availability);
      });
  }, [params.id]);

  const handleConfirm = async (selected: Slot[]) => {
    if (!selected[0]) return;
    await fetch(`/api/bookings/${params.id}/schedule`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startAt: selected[0].start }),
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
