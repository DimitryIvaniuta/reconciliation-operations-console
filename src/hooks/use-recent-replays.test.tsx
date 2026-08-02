import { act, renderHook } from "@testing-library/react";
import { useRecentReplays } from "./use-recent-replays";

describe("useRecentReplays", () => {
  it("deduplicates and bounds non-sensitive replay navigation history", () => {
    const { result } = renderHook(() => useRecentReplays());
    act(() => {
      for (let index = 0; index < 10; index += 1) result.current.remember(`job-${index}`);
      result.current.remember("job-9");
    });
    expect(result.current.ids).toHaveLength(8);
    expect(result.current.ids[0]).toBe("job-9");
    act(() => result.current.remove("job-9"));
    expect(result.current.ids).not.toContain("job-9");
  });
});
