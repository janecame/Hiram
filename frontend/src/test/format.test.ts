import { describe, it, expect } from "vitest";
import { formatPeso, formatDistance, haversineKm } from "../lib/format";

describe("formatPeso", () => {
  it("formats a whole number as Philippine peso", () => {
    expect(formatPeso(250)).toBe("₱250");
  });

  it("rounds down decimals (maximumFractionDigits: 0)", () => {
    expect(formatPeso(199.9)).toBe("₱200");
  });
});

describe("formatDistance", () => {
  it("returns empty string when distance is undefined", () => {
    expect(formatDistance(undefined)).toBe("");
  });

  it("formats distance to one decimal place", () => {
    expect(formatDistance(1.234)).toBe("1.2 km away");
  });

  it("returns empty string when distance is null", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(formatDistance(null as any)).toBe("");
  });
});

describe("haversineKm", () => {
  it("returns 0 for the same coordinates", () => {
    expect(haversineKm(14.5995, 120.9842, 14.5995, 120.9842)).toBe(0);
  });

  it("calculates ~111 km per degree of latitude", () => {
    const km = haversineKm(0, 0, 1, 0);
    expect(km).toBeCloseTo(111.2, 0);
  });
});