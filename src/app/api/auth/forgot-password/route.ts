import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getResendClient, EMAIL_FROM } from "@/lib/email";
import { generateResetToken } from "@/lib/passwordReset";

const forgotPasswordSchema = z.object({ email: z.string().email() });

// Always the same shape and wording, whether or not the email matched an
// account, so this endpoint can't be used to discover who has an account.
const genericResponse = {
  message: "If an account exists for that email, we've sent a password reset link.",
};

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user) {
    return NextResponse.json(genericResponse);
  }

  const { token, tokenHash, expiresAt } = generateResetToken();
  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash, expiresAt },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  const resend = getResendClient();
  if (!resend) {
    // Resend isn't configured (e.g. local dev without an API key). Return
    // the link directly so the flow can still be exercised end to end.
    return NextResponse.json({ ...genericResponse, resetUrl, devMode: true });
  }

  await resend.emails.send({
    from: EMAIL_FROM,
    to: user.email,
    subject: "Reset your FYstay password",
    html: `<p>Someone requested a password reset for your FYstay account.</p><p><a href="${resetUrl}">Reset your password</a></p><p>This link expires in an hour. If you didn't request this, you can safely ignore this email.</p>`,
  });

  return NextResponse.json(genericResponse);
}
