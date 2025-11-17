import { cookies, headers } from "next/headers";

import CheckoutClient from "./CheckoutClient";
import {
  TimeSlot,
  getDefaultTimezone,
  normalizeSlots,
} from "../../../../../../../lib/availability";
import type { ProfileResponse } from "../../../../../../types/profile";

const PAYMENT_ERROR_MESSAGE =
  "We were unable to load the payment form. Please refresh and try again.";

type PageProps = {
  params: { id: string };
  searchParams: Record<string, string | string[] | undefined>;
};

function firstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }
  return value ?? null;
}

function parseSlots(
  slotsParam: string | null,
  fallbackTimezone: string
): TimeSlot[] {
  if (!slotsParam) return [];
  try {
    const parsed = JSON.parse(slotsParam);
    if (!Array.isArray(parsed)) return [];
    return normalizeSlots(parsed, fallbackTimezone);
  } catch {
    return [];
  }
}

function parseWeeks(weeksParam: string | null): number {
  const parsed = Number.parseInt(weeksParam ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 2;
}

type CheckoutData = {
  professional: ProfileResponse | null;
  clientSecret: string | null;
  errorMessage: string | null;
};

async function loadCheckoutData(professionalId: string): Promise<CheckoutData> {
  const cookieHeader = cookies().toString();
  const sharedHeaders = cookieHeader ? { cookie: cookieHeader } : undefined;
  const headersList = headers();
  const protocol = headersList.get("x-forwarded-proto") ?? "http";
  const host =
  headersList.get("x-forwarded-host") ??
  headersList.get("host") ??
  "localhost:3000";
  const baseUrl = `${protocol}://${host}`;

  try {
    const [professionalRes, intentRes] = await Promise.all([
      fetch(`${baseUrl}/api/candidate/professionals/${professionalId}`, {
        cache: "no-store",
        headers: {
          ...(sharedHeaders ?? {}),
        },
      }),
      fetch(`${baseUrl}/api/shared/stripe/intent`, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          ...(sharedHeaders ?? {}),
        },
        body: JSON.stringify({ professionalId }),
      }),
    ]);

    let professional: ProfileResponse | null = null;
    if (professionalRes.ok) {
      professional = (await professionalRes.json()) as ProfileResponse;
    }

    if (intentRes.ok) {
      const intentData = await intentRes.json();
      const secret = intentData?.clientSecret;
      if (typeof secret === "string") {
        return { professional, clientSecret: secret, errorMessage: null };
      }
    }

    return {
      professional,
      clientSecret: null,
      errorMessage: PAYMENT_ERROR_MESSAGE,
    };
  } catch (error) {
    console.error("Failed to load checkout data", error);
    return {
      professional: null,
      clientSecret: null,
      errorMessage: PAYMENT_ERROR_MESSAGE,
    };
  }
}

export default async function CheckoutPage({
  params,
  searchParams,
}: PageProps) {
  const fallbackTimezone = getDefaultTimezone();
  const slots = parseSlots(firstValue(searchParams.slots), fallbackTimezone);
  const weeks = parseWeeks(firstValue(searchParams.weeks));

  const { professional, clientSecret, errorMessage } = await loadCheckoutData(
    params.id
  );

  return (
    <CheckoutClient
      professionalId={params.id}
      professional={professional}
      clientSecret={clientSecret}
      slots={slots}
      weeks={weeks}
      candidateTimezone={fallbackTimezone}
      errorMessage={errorMessage}
    />
  );
}
