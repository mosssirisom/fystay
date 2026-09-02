import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Host guide",
  description: "How to list and manage a property on FYstay, the Fylde Coast's local accommodation marketplace.",
};

const STEPS = [
  {
    title: "1. Create a listing",
    description:
      "From your host dashboard, add your property's title, description, city, address, and property type, plus your nightly price, cleaning fee, and how many guests/bedrooms/beds/bathrooms it has.",
  },
  {
    title: "2. Add photos and amenities",
    description:
      "Upload real photos of your property and tick the amenities that genuinely apply (Wifi, parking, kitchen, pet-friendly, and more). Accurate listings get fewer cancellations and better reviews.",
  },
  {
    title: "3. Choose a cancellation policy",
    description:
      "Pick Flexible, Moderate, Strict, or set your own Custom refund percentage and cutoff. This is shown to guests before they book, and drives every refund calculation automatically.",
  },
  {
    title: "4. Publish and manage availability",
    description:
      "Publish your listing to make it bookable, and block off any dates it isn't available (maintenance, personal use) from its calendar.",
  },
  {
    title: "5. Manage bookings",
    description:
      "Confirmed bookings, date-change requests, and cancellations all appear on your host dashboard. Respond to date-change requests and reviews from there too.",
  },
];

export default function HostGuidePage() {
  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Host guide</h1>
      <p className="mt-2 text-sm text-zinc-500">
        A quick walkthrough of listing your property and managing bookings on FY Stay.
      </p>

      <div className="mt-8 flex flex-col gap-6">
        {STEPS.map((step) => (
          <div key={step.title}>
            <p className="text-sm font-semibold text-foreground">{step.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/host/listings/new" className={cn(buttonVariants())}>
          Create your first listing
        </Link>
        <Link href="/host/dashboard" className={cn(buttonVariants({ variant: "outline" }))}>
          Go to host dashboard
        </Link>
      </div>
    </div>
  );
}
