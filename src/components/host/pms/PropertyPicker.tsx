"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

type ExternalProperty = { externalPropertyId: string; name: string; address?: string | null };

/** Shown once a connection has real credentials but no chosen property yet - every other adapter call (rooms, rates, reservations) is scoped to one property, so this has to happen before the room mapping table can appear. */
export function PropertyPicker({ providerPath, label }: { providerPath: string; label: string }) {
  const router = useRouter();
  const [properties, setProperties] = useState<ExternalProperty[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/host/pms/connections/${providerPath}/properties`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setLoadError(data.error);
          return;
        }
        setProperties(data.properties ?? []);
        if (data.properties?.[0]) setSelectedId(data.properties[0].externalPropertyId);
      })
      .catch(() => {
        if (!cancelled) setLoadError(`Couldn't reach ${label}.`);
      });
    return () => {
      cancelled = true;
    };
  }, [providerPath, label]);

  async function handleSelect() {
    const property = properties?.find((p) => p.externalPropertyId === selectedId);
    if (!property) return;
    setSaving(true);
    const res = await fetch(`/api/host/pms/connections/${providerPath}/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ externalPropertyId: property.externalPropertyId, name: property.name }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Couldn't select that property.");
      return;
    }
    toast.success(`Importing from ${property.name}`);
    router.refresh();
  }

  return (
    <Card className="p-5">
      <CardHeader className="p-0">
        <CardTitle>Choose a property</CardTitle>
      </CardHeader>
      <CardContent className="mt-3 flex flex-col gap-4 p-0">
        <p className="text-sm text-stone-500">
          Pick which {label} property to import rooms, rates and bookings from.
        </p>
        {loadError ? (
          <p className="text-sm text-red-600">{loadError}</p>
        ) : properties === null ? (
          <div className="flex items-center gap-2 text-sm text-stone-500">
            <Spinner className="h-4 w-4" />
            Loading properties...
          </div>
        ) : properties.length === 0 ? (
          <p className="text-sm text-stone-500">No properties found on this {label} account.</p>
        ) : (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="sm:max-w-xs"
            >
              {properties.map((property) => (
                <option key={property.externalPropertyId} value={property.externalPropertyId}>
                  {property.name}
                </option>
              ))}
            </Select>
            <Button onClick={handleSelect} loading={saving} className="sm:self-start">
              Use this property
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
