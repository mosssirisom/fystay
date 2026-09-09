import { describe, expect, it } from "vitest";
import { diffIcalImport } from "./icalSync";

const d = (s: string) => new Date(s);

describe("diffIcalImport", () => {
  it("upserts every event when nothing exists yet", () => {
    const plan = diffIcalImport(
      [],
      [{ uid: "u1", start: d("2026-01-01"), end: d("2026-01-05") }],
    );
    expect(plan.toUpsert).toEqual([{ uid: "u1", start: d("2026-01-01"), end: d("2026-01-05") }]);
    expect(plan.toDeleteUids).toEqual([]);
  });

  it("leaves an unchanged event alone entirely", () => {
    const plan = diffIcalImport(
      [{ externalUid: "u1", startDate: d("2026-01-01"), endDate: d("2026-01-05") }],
      [{ uid: "u1", start: d("2026-01-01"), end: d("2026-01-05") }],
    );
    expect(plan.toUpsert).toEqual([]);
    expect(plan.toDeleteUids).toEqual([]);
  });

  it("upserts an event whose dates changed since last sync", () => {
    const plan = diffIcalImport(
      [{ externalUid: "u1", startDate: d("2026-01-01"), endDate: d("2026-01-05") }],
      [{ uid: "u1", start: d("2026-01-02"), end: d("2026-01-06") }],
    );
    expect(plan.toUpsert).toEqual([{ uid: "u1", start: d("2026-01-02"), end: d("2026-01-06") }]);
    expect(plan.toDeleteUids).toEqual([]);
  });

  it("deletes a previously-synced block whose event is no longer in the feed", () => {
    const plan = diffIcalImport(
      [{ externalUid: "gone", startDate: d("2026-01-01"), endDate: d("2026-01-05") }],
      [],
    );
    expect(plan.toUpsert).toEqual([]);
    expect(plan.toDeleteUids).toEqual(["gone"]);
  });

  it("handles a mix of new, unchanged, changed, and removed events in one diff", () => {
    const plan = diffIcalImport(
      [
        { externalUid: "unchanged", startDate: d("2026-01-01"), endDate: d("2026-01-05") },
        { externalUid: "changed", startDate: d("2026-02-01"), endDate: d("2026-02-05") },
        { externalUid: "removed", startDate: d("2026-03-01"), endDate: d("2026-03-05") },
      ],
      [
        { uid: "unchanged", start: d("2026-01-01"), end: d("2026-01-05") },
        { uid: "changed", start: d("2026-02-02"), end: d("2026-02-06") },
        { uid: "new", start: d("2026-04-01"), end: d("2026-04-05") },
      ],
    );
    expect(plan.toUpsert.map((e) => e.uid).sort()).toEqual(["changed", "new"]);
    expect(plan.toDeleteUids).toEqual(["removed"]);
  });

  it("is a no-op both ways for two empty lists", () => {
    expect(diffIcalImport([], [])).toEqual({ toUpsert: [], toDeleteUids: [] });
  });
});
