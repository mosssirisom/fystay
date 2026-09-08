import { afterEach, describe, expect, it } from "vitest";
import { getCompanyInfo } from "./companyInfo";

const KEYS = ["NEXT_PUBLIC_COMPANY_LEGAL_NAME", "NEXT_PUBLIC_COMPANY_NUMBER", "NEXT_PUBLIC_COMPANY_ADDRESS"] as const;

afterEach(() => {
  for (const key of KEYS) delete process.env[key];
});

describe("getCompanyInfo", () => {
  it("returns null when nothing is configured", () => {
    expect(getCompanyInfo()).toBeNull();
  });

  it("returns null when only some fields are set", () => {
    process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME = "FYStay Ltd";
    expect(getCompanyInfo()).toBeNull();
  });

  it("returns the full record once every field is set", () => {
    process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME = "FYStay Ltd";
    process.env.NEXT_PUBLIC_COMPANY_NUMBER = "12345678";
    process.env.NEXT_PUBLIC_COMPANY_ADDRESS = "1 Example Street, Blackpool, FY1 1AA";
    expect(getCompanyInfo()).toEqual({
      legalName: "FYStay Ltd",
      companyNumber: "12345678",
      registeredAddress: "1 Example Street, Blackpool, FY1 1AA",
    });
  });
});
