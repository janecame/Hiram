import { STATUSES } from "../types/item";
import type { ItemStatus } from "../types/item";

describe("ItemStatus constants", () => {
  it("contains exactly the three expected statuses", () => {
    expect(STATUSES).toEqual(["available", "unavailable", "reserved"]);
  });

  it("has 3 entries", () => {
    expect(STATUSES).toHaveLength(3);
  });

  it("includes available", () => {
    expect(STATUSES).toContain<ItemStatus>("available");
  });

  it("includes unavailable", () => {
    expect(STATUSES).toContain<ItemStatus>("unavailable");
  });

  it("includes reserved", () => {
    expect(STATUSES).toContain<ItemStatus>("reserved");
  });
});
