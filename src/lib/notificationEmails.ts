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

/**
 * Sent to the host the moment a guest submits a request-to-book request
 * (Listing.instantBook = false) - the host's card-free equivalent of
 * sendBookingConfirmedEmails' "new booking" alert, since nothing has been
 * charged yet for a request. hoursToRespond is REQUEST_HOLD_HOURS from
 * availability.ts, passed in rather than imported so this file keeps its
 * existing "just builds and sends messages" shape.
 */
export async function sendBookingRequestReceivedEmail(
  ctx: BookingEmailContext,
  hoursToRespond: number,
): Promise<void> {
  const resend = getResendClient();
  if (!resend) return;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ctx.hostEmail,
    subject: `Booking request: ${ctx.listingTitle}`,
    html: `
      <p>Hi ${ctx.hostName},</p>
      <p>${ctx.guestName ?? "A guest"} would like to book <strong>${ctx.listingTitle}</strong>.</p>
      <p>${stayLine(ctx)}<br>
      Total: ${formatPrice(ctx.totalPriceCents)}</p>
      <p>Please respond within ${hoursToRespond} hours, or the request expires and the guest is notified automatically.</p>
      <p><a href="${ctx.bookingUrl}">Review this request</a></p>
    `,
  });
}

/**
 * Sent to the guest once their request-to-book request has been resolved,
 * one way or another. "approved" points them at the checkout link they
 * still need to complete (bookingUrl doubles as that link - see the
 * approve branch of /api/bookings/[id]/respond); "declined" and "expired"
 * both mean the same practical thing (no reservation, dates released) but
 * read very differently to a guest, so they're worded apart rather than
 * collapsed into one generic "not approved" message.
 */
export async function sendBookingRequestRespondedEmail(
  ctx: BookingEmailContext,
  outcome: "approved" | "declined" | "expired",
): Promise<void> {
  const resend = getResendClient();
  if (!resend || !ctx.guestEmail) return;

  const subject =
    outcome === "approved"
      ? `Request approved: ${ctx.listingTitle}`
      : `Request not approved: ${ctx.listingTitle}`;
  const bodyLine =
    outcome === "approved"
      ? `Great news - ${ctx.hostName} approved your request. Complete payment to confirm your stay.`
      : outcome === "declined"
        ? `${ctx.hostName} wasn't able to accept your request for these dates.`
        : `${ctx.hostName} didn't respond in time, so this request has expired. Any credit you applied has been returned to your account.`;
  const linkLabel = outcome === "approved" ? "Complete your booking" : "View details";

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ctx.guestEmail,
    subject,
    html: `
      <p>Hi ${ctx.guestName ?? "there"},</p>
      <p>${bodyLine}</p>
      <p><strong>${ctx.listingTitle}</strong><br>
      ${stayLine(ctx)}</p>
      <p><a href="${ctx.bookingUrl}">${linkLabel}</a></p>
    `,
  });
}

/**
 * Sent to the guest once their booking enters the security-deposit
 * authorization window (see needsDepositAuthorization in
 * securityDeposit.ts) - a real card hold, not a charge, so the wording is
 * explicit that nothing is being taken from them yet.
 */
export async function sendDepositAuthorizationRequestEmail(
  ctx: BookingEmailContext,
  depositCents: number,
  authorizeUrl: string,
): Promise<void> {
  const resend = getResendClient();
  if (!resend || !ctx.guestEmail) return;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ctx.guestEmail,
    subject: `Action needed: authorize your security deposit for ${ctx.listingTitle}`,
    html: `
      <p>Hi ${ctx.guestName ?? "there"},</p>
      <p>Your stay at <strong>${ctx.listingTitle}</strong> is coming up. This listing requires a
      refundable security deposit hold of ${formatPrice(depositCents)} - this places a hold on your
      card, it does not charge you. It's released automatically after your stay unless the host
      files a damage claim.</p>
      <p>${stayLine(ctx)}</p>
      <p><a href="${authorizeUrl}">Authorize your security deposit</a></p>
    `,
  });
}

/**
 * Sent to the guest once a host has resolved an AUTHORIZED deposit hold -
 * either released (nothing claimed) or captured (a real charge for
 * something the host says went wrong, so the guest gets the reason, not
 * just the amount).
 */
export async function sendDepositResolvedEmail(
  ctx: BookingEmailContext,
  outcome:
    | { outcome: "released"; depositCents: number }
    | { outcome: "captured"; depositCents: number; capturedCents: number; reason: string },
): Promise<void> {
  const resend = getResendClient();
  if (!resend || !ctx.guestEmail) return;

  const subject =
    outcome.outcome === "released"
      ? `Your security deposit has been released: ${ctx.listingTitle}`
      : `Your security deposit was claimed: ${ctx.listingTitle}`;
  const bodyLine =
    outcome.outcome === "released"
      ? `Your ${formatPrice(outcome.depositCents)} security deposit hold has been released in full - nothing was claimed.`
      : `${ctx.hostName} claimed ${formatPrice(outcome.capturedCents)} of your ${formatPrice(outcome.depositCents)} security deposit. Reason given: "${outcome.reason}"`;

  await resend.emails.send({
    from: EMAIL_FROM,
    to: ctx.guestEmail,
    subject,
    html: `
      <p>Hi ${ctx.guestName ?? "there"},</p>
      <p>${bodyLine}</p>
      <p><strong>${ctx.listingTitle}</strong><br>
      ${stayLine(ctx)}</p>
      <p><a href="${ctx.bookingUrl}">View your booking</a></p>
    `,
  });
}
