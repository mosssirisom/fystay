import { describe, expect, it } from "vitest";
import { diffPmsReservations } from "./sync";
import type { PmsExternalReservation } from "./types";

const d = (s: string) => new Date(s);

function reservation(overrides: Partial<PmsExternalReservation> = {}): PmsExternalReservation {
  return {
    externalReservationId: "r1",
    externalRoomId: "room1",
    checkIn: d("2026-01-01"),
    checkOut: d("2026-01-05"),
    roomsBooked: 1,
    status: "confirmed",
    guestName: "Jamie Guest",
    ...overrides,
  };
}

describe("diffPmsReservations", () => {
  it("upserts every confirmed reservation when nothing exists yet", () => {
    const plan = diffPmsReservations([], [reservation()]);
    expect(plan.toUpsert).toEqual([reservation()]);
    expect(plan.toDeleteUids).toEqual([]);
  });

  it("leaves an unchanged reservation alone entirely", () => {
    const plan = diffPmsReservations(
      [{ externalUid: "r1", startDate: d("2026-01-01"), endDate: d("2026-01-05") }],
      [reservation()],
    );
    expect(plan.toUpsert).toEqual([]);
    expect(plan.toDeleteUids).toEqual([]);
  });

  it("upserts a reservation whose dates changed since last sync", () => {
    const plan = diffPmsReservations(
      [{ externalUid: "r1", startDate: d("2026-01-01"), endDate: d("2026-01-05") }],
      [reservation({ checkIn: d("2026-01-02"), checkOut: d("2026-01-06") })],
    );
    expect(plan.toUpsert).toEqual([reservation({ checkIn: d("2026-01-02"), checkOut: d("2026-01-06") })]);
    expect(plan.toDeleteUids).toEqual([]);
  });

  it("deletes a previously-imported block whose reservation is gone", () => {
    const plan = diffPmsReservations(
      [{ externalUid: "gone", startDate: d("2026-01-01"), endDate: d("2026-01-05") }],
      [],
    );
    expect(plan.toUpsert).toEqual([]);
    expect(plan.toDeleteUids).toEqual(["gone"]);
  });

  it("treats a cancelled reservation the same as a deleted one, never upserting it", () => {
    const plan = diffPmsReservations(
      [{ externalUid: "r1", startDate: d("2026-01-01"), endDate: d("2026-01-05") }],
      [reservation({ status: "cancelled" })],
    );
    expect(plan.toUpsert).toEqual([]);
    expect(plan.toDeleteUids).toEqual(["r1"]);
  });

  it("never upserts a cancelled reservation that was never synced in the first place", () => {
    const plan = diffPmsReservations([], [reservation({ status: "cancelled" })]);
    expect(plan.toUpsert).toEqual([]);
    expect(plan.toDeleteUids).toEqual([]);
  });

  it("handles a mix of new, unchanged, changed, cancelled, and removed reservations in one diff", () => {
    const plan = diffPmsReservations(
      [
        { externalUid: "unchanged", startDate: d("2026-01-01"), endDate: d("2026-01-05") },
        { externalUid: "changed", startDate: d("2026-02-01"), endDate: d("2026-02-05") },
        { externalUid: "cancelled", startDate: d("2026-03-01"), endDate: d("2026-03-05") },
      ],
      [
        reservation({ externalReservationId: "unchanged", checkIn: d("2026-01-01"), checkOut: d("2026-01-05") }),
        reservation({ externalReservationId: "changed", checkIn: d("2026-02-02"), checkOut: d("2026-02-06") }),
        reservation({ externalReservationId: "cancelled", status: "cancelled" }),
        reservation({ externalReservationId: "new", checkIn: d("2026-04-01"), checkOut: d("2026-04-05") }),
      ],
    );
    expect(plan.toUpsert.map((r) => r.externalReservationId).sort()).toEqual(["changed", "new"]);
    expect(plan.toDeleteUids.sort()).toEqual(["cancelled"]);
  });

  it("is a no-op both ways for two empty lists", () => {
    expect(diffPmsReservations([], [])).toEqual({ toUpsert: [], toDeleteUids: [] });
  });
});
