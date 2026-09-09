"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BadgeCheck, Phone } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Field, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

/**
 * Phone verification via Twilio Verify (src/lib/phoneVerification.ts) -
 * `configured` mirrors IdentityVerificationCard's own `configured` prop:
 * whether the vendor is set up at all, decided server-side, not by
 * anything this component can see about itself.
 */
export function PhoneVerificationCard({
  verifiedPhone,
  configured,
}: {
  verifiedPhone: string | null;
  configured: boolean;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(verifiedPhone ?? "");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function sendCode() {
    setSending(true);
    const res = await fetch("/api/account/phone/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim() }),
    });
    const data = await res.json();
    setSending(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not send a verification code.");
      return;
    }
    setCodeSent(true);
    toast.success("Code sent - check your messages.");
  }

  async function verifyCode() {
    setVerifying(true);
    const res = await fetch("/api/account/phone/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), code: code.trim() }),
    });
    const data = await res.json();
    setVerifying(false);
    if (!res.ok) {
      toast.error(data.error ?? "Could not verify that code.");
      return;
    }
    toast.success("Phone number verified");
    setCodeSent(false);
    setCode("");
    router.refresh();
  }

  return (
    <Card className="p-5">
      <CardHeader className="flex flex-row items-center justify-between gap-3 p-0">
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-4.5 w-4.5 text-zinc-400" aria-hidden />
          Phone verification
        </CardTitle>
        {verifiedPhone && <Badge variant="success">Verified</Badge>}
      </CardHeader>
      <CardContent className="mt-3 flex flex-col gap-3 p-0 text-sm text-zinc-600">
        {verifiedPhone && !codeSent ? (
          // A past verification stays true regardless of whether Twilio
          // happens to be configured in this environment right now - only
          // verifying a NEW number needs `configured`.
          <>
            <p className="flex items-center gap-1.5 text-foreground">
              <BadgeCheck className="h-4 w-4 shrink-0 text-brand-600" aria-hidden />
              {verifiedPhone}
            </p>
            {configured && (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => {
                  setPhone("");
                  setCodeSent(false);
                }}
              >
                Use a different number
              </Button>
            )}
          </>
        ) : !configured ? (
          <p>Phone verification isn&apos;t available right now.</p>
        ) : (
          <>
            <p>Verify your phone number so hosts and guests know it&apos;s really you.</p>
            <Field>
              <Label htmlFor="phone">Phone number</Label>
              <div className="flex gap-2">
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+447911123456"
                  disabled={codeSent}
                />
                {!codeSent && (
                  <Button onClick={sendCode} loading={sending} disabled={!phone.trim()}>
                    Send code
                  </Button>
                )}
              </div>
            </Field>
            {codeSent && (
              <Field>
                <Label htmlFor="verificationCode">Verification code</Label>
                <div className="flex gap-2">
                  <Input
                    id="verificationCode"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="123456"
                  />
                  <Button onClick={verifyCode} loading={verifying} disabled={!code.trim()}>
                    Verify
                  </Button>
                </div>
              </Field>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
