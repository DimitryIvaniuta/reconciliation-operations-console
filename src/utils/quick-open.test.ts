import { describe, expect, it } from "vitest";
import { parseQuickOpen } from "./quick-open";

const id = "123e4567-e89b-42d3-a456-426614174000";

describe("parseQuickOpen", () => {
  it("requires an explicit target and a UUID", () => {
    expect(parseQuickOpen(`report:${id}`)).toEqual({ kind: "report", id });
    expect(parseQuickOpen(`REPLAY: ${id}`)).toEqual({ kind: "replay", id });
    expect(parseQuickOpen(id)).toBeNull();
    expect(parseQuickOpen("report:not-an-id")).toBeNull();
  });
});
