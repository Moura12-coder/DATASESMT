import { describe, it, expect } from "vitest";
import { absenceDays } from "./phase1Complete";
const date = (value: string) => new Date(value);
describe("absence day accounting", () => {
  it("merges overlaps per employee, clips the selected period, and counts endpoints", () => {
    const rows = [
      {
        employeeId: 1,
        startDate: date("2026-01-01"),
        endDate: date("2026-01-10"),
      },
      {
        employeeId: 1,
        startDate: date("2026-01-05"),
        endDate: date("2026-01-12"),
      },
      {
        employeeId: 2,
        startDate: date("2026-01-05"),
        endDate: date("2026-01-05"),
      },
    ];
    expect(absenceDays(rows, date("2026-01-04"), date("2026-01-08"))).toBe(6);
  });
  it("includes open absences only through the requested end date", () => {
    expect(
      absenceDays(
        [{ employeeId: 1, startDate: date("2026-01-01"), endDate: null }],
        date("2026-01-04"),
        date("2026-01-08")
      )
    ).toBe(5);
  });
  it("rejects inverted periods", () => {
    expect(() =>
      absenceDays([], date("2026-02-01"), date("2026-01-01"))
    ).toThrow("Período inválido");
  });
});
