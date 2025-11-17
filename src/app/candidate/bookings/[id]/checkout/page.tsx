import { cookies, headers } from "next/headers";
import CheckoutClient from "./CheckoutClient";

const PAYMENT_ERROR_MESSAGE =
  "We were unable to load the payment form. Please refresh and try again.";

type PageProps = {
  params: { id: string };
};

type CheckoutData = {
  booking: any | null;
  clientSecret: string | null;
  errorMessage: string | null;
};

async function loadCheckoutData(bookingId: string): Promise<CheckoutData> {
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
    const checkoutRes = await fetch(`${baseUrl}/api/candidate/bookings/${bookingId}/checkout`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(sharedHeaders ?? {}),
      },
    });

    if (checkoutRes.ok) {
      const checkoutData = await checkoutRes.json();
      const secret = checkoutData?.clientSecret;
      const booking = checkoutData?.booking;

      if (typeof secret === "string") {
        return { booking, clientSecret: secret, errorMessage: null };
      }
    }

    return {
      booking: null,
      clientSecret: null,
      errorMessage: PAYMENT_ERROR_MESSAGE,
    };
  } catch (error) {
    console.error("Failed to load checkout data", error);
    return {
      booking: null,
      clientSecret: null,
      errorMessage: PAYMENT_ERROR_MESSAGE,
    };
  }
}

export default async function CheckoutPage({ params }: PageProps) {
  const { booking, clientSecret, errorMessage } = await loadCheckoutData(params.id);

  return (
    <CheckoutClient
      bookingId={params.id}
      booking={booking}
      clientSecret={clientSecret}
      errorMessage={errorMessage}
    />
  );
}
