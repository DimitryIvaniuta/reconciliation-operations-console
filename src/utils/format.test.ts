import { formatAmount, formatCount, truncateMiddle } from "./format";

describe("format utilities", () => {
  it("formats operational values and stable identifiers", () => {
    expect(formatCount(12000)).toContain("12");
    expect(formatAmount(19.5)).toContain("19.50");
    expect(truncateMiddle("1234567890abcdef", 4, 4)).toBe("1234…cdef");
    expect(truncateMiddle("short")).toBe("short");
  });
});
