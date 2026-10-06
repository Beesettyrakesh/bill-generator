import { describe, it } from "@jest/globals";
import expect from "expect";
import { hhmmToMinutes, minutesToHHMM, elapsedHHMM } from "@/utils/timeMath";

describe("timeMath — HH.MM meter-reading math", () => {
  describe("hhmmToMinutes", () => {
    it("parses whole hours (no decimal) as :00", () => {
      expect(hhmmToMinutes("578")).toBe(578 * 60);
    });
    it("parses HH.MM minutes literally (.30 = 30 min, not a fraction)", () => {
      expect(hhmmToMinutes("579.30")).toBe(579 * 60 + 30);
    });
    it("parses .45 as 45 minutes", () => {
      expect(hhmmToMinutes("578.45")).toBe(578 * 60 + 45);
    });
    it("treats a single trailing digit as tens of minutes (.3 -> 30)", () => {
      expect(hhmmToMinutes("579.3")).toBe(579 * 60 + 30);
    });
    it("returns NaN for empty input", () => {
      expect(Number.isNaN(hhmmToMinutes(""))).toBe(true);
    });
  });

  describe("minutesToHHMM", () => {
    it("formats 90 minutes as 01.30", () => {
      expect(minutesToHHMM(90)).toBe("01.30");
    });
    it("formats 30 minutes as 00.30", () => {
      expect(minutesToHHMM(30)).toBe("00.30");
    });
    it("zero-pads hours and minutes", () => {
      expect(minutesToHHMM(5 * 60 + 5)).toBe("05.05");
    });
  });

  describe("elapsedHHMM", () => {
    it("578 -> 579.30 is 1h30m (01.30)", () => {
      expect(elapsedHHMM("578", "579.30")).toBe("01.30");
    });
    // The borrow case the old decimal subtraction got wrong:
    // 579.15 - 578.45 as decimals = 0.70, but the real elapsed is 30 minutes.
    it("578.45 -> 579.15 is 30 minutes (00.30), handling the minute borrow", () => {
      expect(elapsedHHMM("578.45", "579.15")).toBe("00.30");
    });
    it("578.15 -> 579.30 is 1h15m (01.15)", () => {
      expect(elapsedHHMM("578.15", "579.30")).toBe("01.15");
    });
    it("578.30 -> 580.15 is 1h45m (01.45)", () => {
      expect(elapsedHHMM("578.30", "580.15")).toBe("01.45");
    });
    it("returns '' when end equals start", () => {
      expect(elapsedHHMM("578.30", "578.30")).toBe("");
    });
    it("returns '' when end is before start in time", () => {
      expect(elapsedHHMM("579.15", "578.45")).toBe("");
    });
  });
});
