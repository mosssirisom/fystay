"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { PhotoUploader } from "@/components/PhotoUploader";
import { resolveCancellationPolicy, type CancellationPolicyKind } from "@/lib/cancellationPolicy";
import { PROPERTY_TYPES, PROPERTY_TYPE_LABEL, type PropertyType } from "@/lib/propertyType";
import { cn } from "@/lib/cn";

function AmenityCheckbox({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "focus-ring rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
        active
          ? "border-brand-600 bg-brand-50 text-brand-800"
          : "border-border-subtle text-zinc-600 hover:bg-surface-muted",
      )}
    >
      {children}
    </button>
  );
}

export type ListingFormValues = {
  title: string;
  description: string;
  propertyType: PropertyType;
  city: string;
  country: string;
  address: string;
  pricePerNight: string;
  cleaningFee: string;
  maxGuests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  photos: string[];
  amenities: string[];
  cancellationPolicy: CancellationPolicyKind;
  customCancellationCutoffDays: string;
  customCancellationRefundPercent: string;
};

const emptyValues: ListingFormValues = {
  title: "",
  description: "",
  propertyType: "APARTMENT",
  city: "",
  country: "",
  address: "",
  pricePerNight: "",
  cleaningFee: "",
  maxGuests: "2",
  bedrooms: "1",
  beds: "1",
  bathrooms: "1",
  photos: [],
  amenities: [],
  cancellationPolicy: "MODERATE",
  customCancellationCutoffDays: "7",
  customCancellationRefundPercent: "50",
};

// A curated checklist covering the amenities guests actually filter by
// (worded to match the regex categories in amenityCategories.ts, so ticking
// one here is guaranteed to be found by that filter) plus other common
// short-stay amenities. Anything a host has that isn't on this list still
// has a home in the free-text "Other amenities" field below it.
const AMENITY_OPTIONS = [
  "Wifi",
  "Free parking",
  "Kitchen",
  "Washer",
  "Dryer",
  "Air conditioning",
  "Heating",
  "TV",
  "Pool",
  "Hot tub",
  "Gym",
  "Pet friendly",
  "Wheelchair accessible",
  "Sea view",
  "Garden",
  "Balcony",
  "BBQ grill",
  "Fireplace",
  "Dedicated workspace",
  "EV charger",
];

function splitAmenities(amenities: string[]): { selected: string[]; custom: string } {
  const selected: string[] = [];
  const custom: string[] = [];
  for (const amenity of amenities) {
    const match = AMENITY_OPTIONS.find((option) => option.toLowerCase() === amenity.toLowerCase());
    if (match) selected.push(match);
    else custom.push(amenity);
  }
  return { selected, custom: custom.join(", ") };
}

const POLICY_PREVIEWS: Record<Exclude<CancellationPolicyKind, "CUSTOM">, string> = {
  FLEXIBLE: resolveCancellationPolicy({ cancellationPolicy: "FLEXIBLE" }).description,
  MODERATE: resolveCancellationPolicy({ cancellationPolicy: "MODERATE" }).description,
  STRICT: resolveCancellationPolicy({ cancellationPolicy: "STRICT" }).description,
};

type Props = {
  listingId?: string;
  initialValues?: ListingFormValues;
};

export function ListingForm({ listingId, initialValues }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ListingFormValues>(initialValues ?? emptyValues);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    () => splitAmenities(initialValues?.amenities ?? []).selected,
  );
  const [customAmenities, setCustomAmenities] = useState<string>(
    () => splitAmenities(initialValues?.amenities ?? []).custom,
  );
  const [pastedUrl, setPastedUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleAmenity(amenity: string) {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity],
    );
  }

  function addPastedUrl() {
    const url = pastedUrl.trim();
    if (!url) return;
    if (!values.photos.includes(url)) {
      update("photos", [...values.photos, url]);
    }
    setPastedUrl("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (values.photos.length === 0) {
      setError("Add at least one photo.");
      toast.error("Add at least one photo.");
      return;
    }

    setLoading(true);

    const payload = {
      title: values.title,
      description: values.description,
      propertyType: values.propertyType,
      city: values.city,
      country: values.country,
      address: values.address || undefined,
      pricePerNightCents: Math.round(Number(values.pricePerNight) * 100),
      cleaningFeeCents: values.cleaningFee ? Math.round(Number(values.cleaningFee) * 100) : 0,
      maxGuests: Number(values.maxGuests),
      bedrooms: Number(values.bedrooms),
      beds: Number(values.beds),
      bathrooms: Number(values.bathrooms),
      photos: values.photos,
      amenities: Array.from(
        new Set([
          ...selectedAmenities,
          ...customAmenities
            .split(",")
            .map((a) => a.trim())
            .filter(Boolean),
        ]),
      ),
      cancellationPolicy: values.cancellationPolicy,
      ...(values.cancellationPolicy === "CUSTOM"
        ? {
            customCancellationCutoffDays: Number(values.customCancellationCutoffDays),
            customCancellationRefundPercent: Number(values.customCancellationRefundPercent),
          }
        : {}),
    };

    const res = await fetch(listingId ? `/api/listings/${listingId}` : "/api/listings", {
      method: listingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      toast.error(data.error ?? "Something went wrong.");
      return;
    }

    toast.success(listingId ? "Listing updated" : "Listing created");
    router.push("/host/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Card>
        <CardHeader>
          <CardTitle>The basics</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              required
              value={values.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Sunlit loft in the heart of the city"
            />
          </Field>
          <Field>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              required
              rows={5}
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
            />
          </Field>
          <Field>
            <Label htmlFor="propertyType">Property type</Label>
            <Select
              id="propertyType"
              value={values.propertyType}
              onChange={(e) => update("propertyType", e.target.value as PropertyType)}
            >
              {PROPERTY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PROPERTY_TYPE_LABEL[type]}
                </option>
              ))}
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                required
                value={values.city}
                onChange={(e) => update("city", e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                required
                value={values.country}
                onChange={(e) => update("country", e.target.value)}
              />
            </Field>
          </div>
          <Field>
            <Label htmlFor="address">Address (optional)</Label>
            <Input
              id="address"
              value={values.address}
              onChange={(e) => update("address", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Capacity & pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <Field>
              <Label htmlFor="price">Price / night (£)</Label>
              <Input
                id="price"
                required
                type="number"
                min={1}
                step="0.01"
                value={values.pricePerNight}
                onChange={(e) => update("pricePerNight", e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="cleaningFee">Cleaning fee (£, optional)</Label>
              <Input
                id="cleaningFee"
                type="number"
                min={0}
                step="0.01"
                value={values.cleaningFee}
                onChange={(e) => update("cleaningFee", e.target.value)}
                placeholder="0"
              />
            </Field>
            <Field>
              <Label htmlFor="maxGuests">Max guests</Label>
              <Input
                id="maxGuests"
                required
                type="number"
                min={1}
                value={values.maxGuests}
                onChange={(e) => update("maxGuests", e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="bedrooms">Bedrooms</Label>
              <Input
                id="bedrooms"
                required
                type="number"
                min={0}
                value={values.bedrooms}
                onChange={(e) => update("bedrooms", e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="beds">Beds</Label>
              <Input
                id="beds"
                required
                type="number"
                min={1}
                value={values.beds}
                onChange={(e) => update("beds", e.target.value)}
              />
            </Field>
            <Field>
              <Label htmlFor="bathrooms">Baths</Label>
              <Input
                id="bathrooms"
                required
                type="number"
                min={0}
                value={values.bathrooms}
                onChange={(e) => update("bathrooms", e.target.value)}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos & amenities</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <Label>Photos</Label>
            <PhotoUploader
              photos={values.photos}
              onChange={(photos) => update("photos", photos)}
            />
            <FieldHint>The first photo is used as the cover image.</FieldHint>

            <details className="mt-3 text-sm">
              <summary className="cursor-pointer font-medium text-zinc-600">
                Or paste an image URL instead
              </summary>
              <div className="mt-2 flex gap-2">
                <Input
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addPastedUrl();
                    }
                  }}
                  placeholder="https://example.com/photo.jpg"
                />
                <Button type="button" variant="outline" onClick={addPastedUrl}>
                  Add
                </Button>
              </div>
            </details>
          </Field>
          <Field>
            <Label>Amenities</Label>
            <div className="flex flex-wrap gap-2">
              {AMENITY_OPTIONS.map((amenity) => (
                <AmenityCheckbox
                  key={amenity}
                  active={selectedAmenities.includes(amenity)}
                  onClick={() => toggleAmenity(amenity)}
                >
                  {amenity}
                </AmenityCheckbox>
              ))}
            </div>
            <div className="mt-3">
              <Label htmlFor="customAmenities">Other amenities</Label>
              <Input
                id="customAmenities"
                value={customAmenities}
                onChange={(e) => setCustomAmenities(e.target.value)}
                placeholder="Sea view, Garden, EV charger"
              />
              <FieldHint>Comma separated - for anything not listed above.</FieldHint>
            </div>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cancellation policy</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Field>
            <Label htmlFor="cancellationPolicy">Refund rules for guest cancellations</Label>
            <Select
              id="cancellationPolicy"
              value={values.cancellationPolicy}
              onChange={(e) =>
                update("cancellationPolicy", e.target.value as CancellationPolicyKind)
              }
            >
              <option value="FLEXIBLE">Flexible</option>
              <option value="MODERATE">Moderate</option>
              <option value="STRICT">Strict</option>
              <option value="CUSTOM">Custom</option>
            </Select>
            <FieldHint>
              {values.cancellationPolicy === "CUSTOM"
                ? "Set your own cutoff and refund percentage below."
                : POLICY_PREVIEWS[values.cancellationPolicy]}
            </FieldHint>
          </Field>

          {values.cancellationPolicy === "CUSTOM" && (
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <Label htmlFor="customCutoff">Full-refund cutoff (days before check-in)</Label>
                <Input
                  id="customCutoff"
                  type="number"
                  min={0}
                  max={90}
                  value={values.customCancellationCutoffDays}
                  onChange={(e) => update("customCancellationCutoffDays", e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="customPercent">Refund percentage before cutoff</Label>
                <Input
                  id="customPercent"
                  type="number"
                  min={0}
                  max={100}
                  value={values.customCancellationRefundPercent}
                  onChange={(e) => update("customCancellationRefundPercent", e.target.value)}
                />
              </Field>
            </div>
          )}
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="self-start">
        {listingId ? "Save changes" : "Create listing"}
      </Button>
    </form>
  );
}
