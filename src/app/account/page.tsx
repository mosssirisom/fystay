import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { UserCircle } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getStripeClient } from "@/lib/stripe";
import { isPhoneVerificationConfigured } from "@/lib/phoneVerification";
import { Card, CardContent } from "@/components/ui/Card";
import { IdentityVerificationCard } from "@/components/IdentityVerificationCard";
import { PhoneVerificationCard } from "@/components/PhoneVerificationCard";

export const metadata: Metadata = { title: "Account", robots: { index: false } };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/account");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      phoneVerifiedAt: true,
      identityVerificationStatus: true,
    },
  });

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-700">
          <UserCircle className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Account</h1>
          <p className="text-sm text-stone-500">Manage your trust and safety details.</p>
        </div>
      </div>

      <Card className="mt-6 p-5">
        <CardContent className="flex flex-col gap-1 p-0 text-sm">
          <p className="font-medium text-foreground">{user.name}</p>
          <p className="text-stone-500">{user.email}</p>
        </CardContent>
      </Card>

      <div className="mt-6 flex flex-col gap-4">
        <IdentityVerificationCard
          status={user.identityVerificationStatus}
          configured={Boolean(getStripeClient())}
        />
        <PhoneVerificationCard
          verifiedPhone={user.phoneVerifiedAt ? user.phone : null}
          configured={isPhoneVerificationConfigured()}
        />
      </div>
    </div>
  );
}
