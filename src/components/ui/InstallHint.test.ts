import { describe, expect, it } from "vitest";
import { isIosSafariUserAgent } from "./InstallHint";

describe("install hint helpers", () => {
  it("returns iOS install instructions for iPhone Safari", () => {
    expect(isIosSafariUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1")).toBe(true);
  });

  it("does not treat standalone mode as installable iOS Safari", () => {
    expect(isIosSafariUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1", true)).toBe(false);
  });
});
