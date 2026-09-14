import { describe, expect, it } from "vitest";
import { isTicketOpener, nextStatusAfterMessage } from "./supportTickets";

describe("isTicketOpener", () => {
  const ticket = { openedById: "opener-1" };

  it("is true for the opener", () => {
    expect(isTicketOpener(ticket, "opener-1")).toBe(true);
  });

  it("is false for anyone else, admin included - admin visibility is a separate check", () => {
    expect(isTicketOpener(ticket, "admin-1")).toBe(false);
  });
});

describe("nextStatusAfterMessage", () => {
  it("reopens a RESOLVED ticket when the opener replies", () => {
    expect(nextStatusAfterMessage("RESOLVED", false)).toBe("OPEN");
  });

  it("reopens a CLOSED ticket when the opener replies", () => {
    expect(nextStatusAfterMessage("CLOSED", false)).toBe("OPEN");
  });

  it("leaves an already-OPEN ticket OPEN when the opener replies", () => {
    expect(nextStatusAfterMessage("OPEN", false)).toBe("OPEN");
  });

  it("never changes status for an admin reply, even into a RESOLVED ticket", () => {
    expect(nextStatusAfterMessage("RESOLVED", true)).toBe("RESOLVED");
  });

  it("never changes status for an admin reply into a CLOSED ticket", () => {
    expect(nextStatusAfterMessage("CLOSED", true)).toBe("CLOSED");
  });
});
