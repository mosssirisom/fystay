import { describe, expect, it } from "vitest";
import { isConversationParticipant, otherParticipant, previewMessage } from "./messaging";

describe("isConversationParticipant", () => {
  const conversation = { guestId: "guest-1", hostId: "host-1" };

  it("is true for the guest", () => {
    expect(isConversationParticipant(conversation, "guest-1")).toBe(true);
  });

  it("is true for the host", () => {
    expect(isConversationParticipant(conversation, "host-1")).toBe(true);
  });

  it("is false for anyone else", () => {
    expect(isConversationParticipant(conversation, "stranger-1")).toBe(false);
  });
});

describe("otherParticipant", () => {
  const conversation = {
    guestId: "guest-1",
    guest: { id: "guest-1", name: "Jamie Guest" },
    hostId: "host-1",
    host: { id: "host-1", name: "Alex Host" },
  };

  it("returns the host when viewed by the guest", () => {
    expect(otherParticipant(conversation, "guest-1")).toEqual({ id: "host-1", name: "Alex Host" });
  });

  it("returns the guest when viewed by the host", () => {
    expect(otherParticipant(conversation, "host-1")).toEqual({ id: "guest-1", name: "Jamie Guest" });
  });
});

describe("previewMessage", () => {
  it("returns short messages unchanged", () => {
    expect(previewMessage("Is the parking free?")).toBe("Is the parking free?");
  });

  it("collapses newlines and repeated whitespace into single spaces", () => {
    expect(previewMessage("Hi there,\n\n  Is early check-in  possible?")).toBe(
      "Hi there, Is early check-in possible?",
    );
  });

  it("truncates long messages with an ellipsis at the given length", () => {
    const long = "a".repeat(100);
    const result = previewMessage(long, 20);
    expect(result).toHaveLength(20);
    expect(result.endsWith("…")).toBe(true);
  });

  it("never truncates a message exactly at the limit", () => {
    const exact = "a".repeat(80);
    expect(previewMessage(exact)).toBe(exact);
  });
});
