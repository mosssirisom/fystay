import { getResendClient, EMAIL_FROM } from "@/lib/email";
import { formatPrice } from "@/lib/format";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  weekday: "short",
  day: "numeric",
  month: "short",
  year: "numeric",
});

/**
 * Everything every booking-lifecycle email needs, gathered once by the
 * caller (the Stripe webhook, the cancel route) rather than re-fetched here -
 * this file only builds and sends messages, it never queries the database
 * itself.
 */
export type BookingEmailContext = {
  reference: string;
  listingTitle: string;
  city: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  guests: number;
  totalPriceCents: number;
  guestName: string | null;
  guestEmail: string | null;
  hostName: string;
  hostEmail: string;
  bookingUrl: string;
};

function stayLine(ctx: BookingEmailContext): string {
  return `${dateFormatter.format(ctx.checkIn)} – ${dateFormatter.format(ctx.checkOut)} (${ctx.nights} night${ctx.nights === 1 ? "" : "s"}, ${ctx.guests} guest${ctx.guests === 1 ? "" : "s"})`;
}

/**
 * Sends both sides of a just-confirmed booking - the guest's receipt and
 * the host's new-booking alert - or silently does nothing if Resend isn't
 * configured (e.g. local development), matching every other email send in
 * this app (see src/app/api/auth/forgot-password/route.ts). Failures are
 * swallowed rather than thrown: a booking that's already been paid for and
 * confirmed must never fail (or get rolled back) just because a
 * notification email didn't send.
 */
export async function sendBookingConfirmedEmails(ctx: BookingEmailContext): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  const sends: Promise<unknown>[] = [];

  if (ctx.guestEmail) {
    sends.push(
      resend.emails.send({
        from: EMAIL_FROM,
        to: ctx.guestEmail,
        subject: `Booking confirmed: ${ctx.listingTitle}`,
        html: `
          <p>Hi ${ctx.guestName ?? "there"},</p>
          <p>Your booking is confirmed - see you in ${ctx.city}.</p>
          <p><strong>${ctx.listingTitle}</strong><br>
          ${stayLine(ctx)}<br>
          Total paid: ${formatPrice(ctx.totalPriceCents)}<br>
          Booking reference: ${ctx.reference}</p>
          <p><a href="${ctx.bookingUrl}">View your booking</a></p>
        `,
      }),
    );
  }

  sends.push(
    resend.emails.send({
      from: EMAIL_FROM,
      to: ctx.hostEmail,
      subject: `New booking: ${ctx.listingTitle}`,
      html: `
        <p>Hi ${ctx.hostName},</p>
        <p>You have a new confirmed booking for <strong>${ctx.listingTitle}</strong>.</p>
        <p>${stayLine(ctx)}<br>
        Booking reference: ${ctx.reference}</p>
        <p><a href="${ctx.bookingUrl}">View on your dashboard</a></p>
      `,
    }),
  );

  await Promise.allSettled(sends);
}

/**
 * Sends both sides of a just-cancelled booking. refundCents is whatever the
 * cancellation policy actually paid back (see src/lib/cancellationPolicy.ts)
 * - never assumed to be the full amount, and 0 is a valid, expected value
 * for a late cancellation under a strict policy.
 */
export async function sendBookingCancelledEmails(
  ctx: BookingEmailContext,
  refundCents: number,
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  const refundLine =
    refundCents > 0
      ? `A refund of ${formatPrice(refundCents)} is on its way back to your original payment method.`
      : `Per the cancellation policy for this stay, no refund applies.`;

  const sends: Promise<unknown>[] = [];

  if (ctx.guestEmail) {
    sends.push(
      resend.emails.send({
        from: EMAIL_FROM,
        to: ctx.guestEmail,
        subject: `Booking cancelled: ${ctx.listingTitle}`,
        html: `
          <p>Hi ${ctx.guestName ?? "there"},</p>
          <p>Your booking has been cancelled.</p>
          <p><strong>${ctx.listingTitle}</strong><br>
          ${stayLine(ctx)}<br>
          Booking reference: ${ctx.reference}</p>
          <p>${refundLine}</p>
          <p><a href="${ctx.bookingUrl}">View your booking</a></p>
        `,
      }),
    );
  }

  sends.push(
    resend.emails.send({
      from: EMAIL_FROM,
      to: ctx.hostEmail,
      subject: `Booking cancelled: ${ctx.listingTitle}`,
      html: `
        <p>Hi ${ctx.hostName},</p>
        <p>A guest has cancelled their booking for <strong>${ctx.listingTitle}</strong>, and those dates are open again.</p>
        <p>${stayLine(ctx)}<br>
        Booking reference: ${ctx.reference}</p>
        <p><a href="${ctx.bookingUrl}">View on your dashboard</a></p>
      `,
    }),
  );

  await Promise.allSettled(sends);
}
