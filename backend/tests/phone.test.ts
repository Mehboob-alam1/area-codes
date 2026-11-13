import { describe, expect, it } from "vitest";
import { inspectPhone } from "../src/lib/phone";
import { redactSearchQuery } from "../src/lib/redact";
import { hasPermission } from "../src/lib/permissions";

describe("phone and permissions", () => {
  it("recognizes a country calling code without treating format validity as ownership", () => {
    const result = inspectPhone("+442079460958");
    expect(result.parsed).toBe(true);
    if (result.parsed) {
      expect(result.countryIso).toBe("GB");
      expect(result.countryCallingCode).toBe("+44");
      expect(result.disclaimer).toMatch(/owned/i);
    }
  });

  it("redacts subscriber-length input and keeps short codes", () => {
    expect(redactSearchQuery("+923001234567").stored.startsWith("redacted:phone:")).toBe(true);
    expect(redactSearchQuery("212").stored).toBe("212");
    expect(redactSearchQuery("Gilgit").searchType).toBe("text");
  });

  it("keeps analysts out of record editing", () => {
    expect(hasPermission("analyst", "records:write")).toBe(false);
    expect(hasPermission("reviewer", "records:verify")).toBe(true);
    expect(hasPermission("editor", "records:delete")).toBe(false);
    expect(hasPermission("super_admin", "records:delete")).toBe(true);
  });
});
