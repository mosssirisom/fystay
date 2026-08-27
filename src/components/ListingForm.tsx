"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Field, FieldHint, Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { PhotoUploader } from "@/components/PhotoUploader";

export type ListingFormValues = {
  title: string;
  description: string;
  city: string;
  country: string;
  address: string;
  pricePerNight: string;
  maxGuests: string;
  bedrooms: string;
  beds: string;
  bathrooms: string;
  photos: string[];
  amenities: string;
};

const emptyValues: ListingFormValues = {
  title: "",
  description: "",
  city: "",
  country: "",
  address: "",
  pricePerNight: "",
  maxGuests: "2",
  bedrooms: "1",
  beds: "1",
  bathrooms: "1",
  photos: [],
  amenities: "",
};

type Props = {
  listingId?: string;
  initialValues?: ListingFormValues;
};

export function ListingForm({ listingId, initialValues }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<ListingFormValues>(initialValues ?? emptyValues);
  const [pastedUrl, setPastedUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof ListingFormValues>(key: K, value: ListingFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
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
      city: values.city,
      country: values.country,
      address: values.address || undefined,
      pricePerNightCents: Math.round(Number(values.pricePerNight) * 100),
      maxGuests: Number(values.maxGuests),
      bedrooms: Number(values.bedrooms),
      beds: Number(values.beds),
      bathrooms: Number(values.bathrooms),
      photos: values.photos,
      amenities: values.amenities
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
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
            <Label htmlFor="amenities">Amenities</Label>
            <Input
              id="amenities"
              value={values.amenities}
              onChange={(e) => update("amenities", e.target.value)}
              placeholder="Wifi, Kitchen, Free parking"
            />
            <FieldHint>Comma separated.</FieldHint>
          </Field>
        </CardContent>
      </Card>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" loading={loading} size="lg" className="self-start">
        {listingId ? "Save changes" : "Create listing"}
      </Button>
    </form>
  );
}
