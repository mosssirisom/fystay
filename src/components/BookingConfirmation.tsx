"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { BookingSummaryCard } from "@/components/BookingSummaryCard";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const POLL_INTERVAL_MS = 1500;
const MAX_POLLS = 12;

type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "REFUNDED";
type PaymentStatus = "UNPAID" | "PAID" | "PARTIALLY_REFUNDED" | "REFUNDED";

export function BookingConfirmation({
  bookingId,
  initialStatus,
  initialPaymentStatus,
  reference,
  listing,
  checkIn,
  checkOut,
  nights,
  guests,
  nightlyPriceCents,
  cleaningFeeCents,
  serviceFeeCents,
  taxCents,
  totalPriceCents,
  guestName,
  guestEmail,
  guestPhone,
}: {
  bookingId: string;
  initialStatus: BookingStatus;
  initialPaymentStatus: PaymentStatus;
  reference: string;
  listing: { title: string; city: string; country: string; photos: string[] };
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  nightlyPriceCents: number;
  cleaningFeeCents: number;
  serviceFeeCents: number;
  taxCents: number;
  totalPriceCents: number;
  guestName: string | null;
  guestEmail: string | null;
  guestPhone: string | null;
}) {
  const [status, setStatus] = useState<BookingStatus>(initialStatus);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(initialPaymentStatus);
  const [pollsExhausted, setPollsExhausted] = useState(false);
  const pollCount = useRef(0);

  useEffect(() => {
    if (status !== "PENDING") return;

    const interval = setInterval(async () => {
      pollCount.current += 1;
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.booking.status !== "PENDING") {
            setStatus(data.booking.status);
            setPaymentStatus(data.booking.paymentStatus);
            clearInterval(interval);
            return;
          }
        }
      } catch {
        // A transient network hiccup while polling isn't worth surfacing;
        // the next tick (or the max-polls fallback) will resolve it.
      }
      if (pollCount.current >= MAX_POLLS) {
        setPollsExhausted(true);
        clearInterval(interval);
      }
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [status, bookingId]);

  if (status === "PENDING") {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        {pollsExhausted ? (
          <>
            <p className="font-medium text-foreground">Still confirming your payment</p>
            <p className="max-w-sm text-sm text-zinc-500">
              This is taking longer than usual. You&apos;ll see your booking under &quot;My
              trips&quot; as soon as it&apos;s confirmed.
            </p>
            <Link href="/bookings" className={cn(buttonVariants(), "mt-2")}>
              Go to my trips
            </Link>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-brand-700" />
            <p className="font-medium text-foreground">Finalizing your payment&hellip;</p>
            <p className="max-w-sm text-sm text-zinc-500">This only takes a moment.</p>
          </>
        )}
      </div>
    );
  }

  const isConfirmed = status === "CONFIRMED" || status === "COMPLETED";

  return (
    <div className="flex flex-col items-center gap-2 py-8 text-center">
      {isConfirmed ? (
        <>
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
          <h1 className="text-2xl font-bold text-foreground">Booking confirmed!</h1>
          <p className="max-w-sm text-sm text-zinc-500">
            You&apos;re all set. A confirmation has been saved to your account under &quot;My
            trips&quot;.
          </p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold text-foreground">Booking {status.toLowerCase()}</h1>
          <p className="max-w-sm text-sm text-zinc-500">
            This reservation is no longer awaiting payment.
          </p>
        </>
      )}

      <div className="mt-6 w-full text-left">
        <BookingSummaryCard
          listing={listing}
          checkIn={checkIn}
          checkOut={checkOut}
          nights={nights}
          guests={guests}
          nightlyPriceCents={nightlyPriceCents}
          cleaningFeeCents={cleaningFeeCents}
          serviceFeeCents={serviceFeeCents}
          taxCents={taxCents}
          totalPriceCents={totalPriceCents}
          reference={reference}
          guestName={guestName}
          guestEmail={guestEmail}
          guestPhone={guestPhone}
          paymentStatus={paymentStatus}
        />
      </div>

      <div className="mt-6 flex w-full flex-col gap-2 sm:flex-row sm:justify-center">
        <Link href="/bookings" className={cn(buttonVariants(), "w-full sm:w-auto")}>
          View my trips
        </Link>
        <Link
          href="/"
          className={cn(buttonVariants({ variant: "outline" }), "w-full sm:w-auto")}
        >
          Explore more stays
        </Link>
      </div>
    </div>
  );
}
