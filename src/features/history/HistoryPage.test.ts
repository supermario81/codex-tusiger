import { describe, expect, it } from "vitest";
import { TWINT_DONATION_URL } from "./HistoryPage";

describe("history donation", () => {
  it("keeps the TWINT token URL external to the app router", () => {
    expect(TWINT_DONATION_URL).toContain("https://sbs.twint.ch/");
    expect(TWINT_DONATION_URL).toContain("#token=");
    expect(TWINT_DONATION_URL).not.toContain("supermario81.github.io");
  });
});
