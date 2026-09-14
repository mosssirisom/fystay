"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";

export type MappableListing = {
  id: string;
  title: string;
  propertyType: string;
  roomTypes: { id: string; name: string }[];
};

type ExternalRoom = {
  externalRoomId: string;
  externalPropertyId: string;
  name: string;
  maxOccupancy?: number | null;
  mapping: { id: string; listingId: string; listingTitle: string; roomTypeId: string | null; roomTypeName: string | null } | null;
};

const UNMAPPED = "";

/** One row per PMS room, each with a dropdown of every FYStay listing (and, for a HOTEL listing, its room types) to map it to - the mapping itself drives availability/rate sync and where a new FYStay booking gets pushed back. */
export function RoomMappingTable({
  providerPath,
  listings,
}: {
  providerPath: string;
  listings: MappableListing[];
}) {
  const [rooms, setRooms] = useState<ExternalRoom[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [savingRoomId, setSavingRoomId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/host/pms/connections/${providerPath}/rooms`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.error) {
          setLoadError(data.error);
          return;
        }
        setRooms(data.rooms ?? []);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load rooms.");
      });
    return () => {
      cancelled = true;
    };
  }, [providerPath]);

  function targetValue(mapping: ExternalRoom["mapping"]): string {
    if (!mapping) return UNMAPPED;
    return mapping.roomTypeId ? `${mapping.listingId}:${mapping.roomTypeId}` : mapping.listingId;
  }

  async function handleChange(room: ExternalRoom, value: string) {
    setSavingRoomId(room.externalRoomId);

    if (value === UNMAPPED) {
      if (room.mapping) {
        const res = await fetch(`/api/host/pms/connections/${providerPath}/mappings/${room.mapping.id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          toast.error("Couldn't remove that mapping.");
          setSavingRoomId(null);
          return;
        }
      }
      setRooms((prev) => prev?.map((r) => (r.externalRoomId === room.externalRoomId ? { ...r, mapping: null } : r)) ?? null);
      setSavingRoomId(null);
      return;
    }

    const [listingId, roomTypeId] = value.split(":");
    const res = await fetch(`/api/host/pms/connections/${providerPath}/mappings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        externalRoomId: room.externalRoomId,
        externalRoomName: room.name,
        listingId,
        roomTypeId: roomTypeId ?? null,
      }),
    });
    const data = await res.json();
    setSavingRoomId(null);
    if (!res.ok) {
      toast.error(data.error ?? "Couldn't save that mapping.");
      return;
    }

    const listing = listings.find((l) => l.id === listingId);
    const roomType = roomTypeId ? listing?.roomTypes.find((rt) => rt.id === roomTypeId) : undefined;
    setRooms(
      (prev) =>
        prev?.map((r) =>
          r.externalRoomId === room.externalRoomId
            ? {
                ...r,
                mapping: {
                  id: data.mapping.id,
                  listingId,
                  listingTitle: listing?.title ?? "",
                  roomTypeId: roomTypeId ?? null,
                  roomTypeName: roomType?.name ?? null,
                },
              }
            : r,
        ) ?? null,
    );
    toast.success("Mapping saved");
  }

  return (
    <Card className="p-5">
      <CardHeader className="p-0">
        <CardTitle>Map rooms</CardTitle>
      </CardHeader>
      <CardContent className="mt-3 p-0">
        <p className="text-sm text-stone-500">
          Match each room from your PMS to the FYStay listing (or, for a hotel, the specific room
          type) it should sync availability, rates and bookings with.
        </p>

        {loadError ? (
          <p className="mt-4 text-sm text-red-600">{loadError}</p>
        ) : rooms === null ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
            <Spinner className="h-4 w-4" />
            Loading rooms...
          </div>
        ) : rooms.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">No rooms found for this property.</p>
        ) : listings.length === 0 ? (
          <p className="mt-4 text-sm text-stone-500">
            You don&apos;t have any FYStay listings to map to yet - create one first.
          </p>
        ) : (
          <div className="mt-4 flex flex-col divide-y divide-border-subtle">
            {rooms.map((room) => (
              <div
                key={room.externalRoomId}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{room.name}</span>
                  {room.mapping ? (
                    <Badge variant="success">Mapped</Badge>
                  ) : (
                    <Badge variant="neutral">Unmapped</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:w-64">
                  {savingRoomId === room.externalRoomId && <Spinner className="h-4 w-4" />}
                  <Select
                    value={targetValue(room.mapping)}
                    onChange={(e) => handleChange(room, e.target.value)}
                    disabled={savingRoomId === room.externalRoomId}
                  >
                    <option value={UNMAPPED}>Not mapped</option>
                    {listings.map((listing) =>
                      listing.propertyType === "HOTEL" ? (
                        <optgroup key={listing.id} label={listing.title}>
                          {listing.roomTypes.map((roomType) => (
                            <option key={roomType.id} value={`${listing.id}:${roomType.id}`}>
                              {roomType.name}
                            </option>
                          ))}
                        </optgroup>
                      ) : (
                        <option key={listing.id} value={listing.id}>
                          {listing.title}
                        </option>
                      ),
                    )}
                  </Select>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
