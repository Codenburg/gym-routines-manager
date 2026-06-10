/**
 * Unit tests for the `formatHorario` pure function.
 *
 * Covers the public `/informacion` rendering rules:
 *   - All 7 days open with the same hours → "Lun a Dom 8:00 a 22:00"
 *   - Mon-Fri 8-22, Sat 9-14, Sun closed → 3 groups joined by " · "
 *   - All 7 days closed → `null` (section hides itself)
 *   - All 7 days with different hours → 7 individual groups
 *   - Mon-Fri open, Sat-Sun closed → 2 groups ("Lun a Vie …" + "Sáb y Dom cerrado")
 *   - Single day open alone (Mié) → 1 group
 *   - Edge: `apertura === cierre` (zero-length day) → renders verbatim
 *   - Edge: `apertura > cierre` (cross-midnight, NOT supported in v1) → renders literally
 *
 * v1 limitation: cross-midnight schedules are accepted at the data level
 * but render as if the closure happens the same day. Documented in the
 * spec and the formatHorario JSDoc.
 */

import { describe, it, expect } from "vitest";
import { formatHorario } from "@/components/informacion/format-horario";
import type { HorarioDia, HorarioSemanal } from "@/lib/schemas";

/** Build a HorarioDia with sensible defaults — only `abierto` defaults to true. */
function open(apertura: string, cierre: string): HorarioDia {
  return { abierto: true, apertura, cierre };
}

/** Build a HorarioDia with the closed shape. */
function closed(): HorarioDia {
  return { abierto: false, apertura: null, cierre: null };
}

/** Build a 7-day schedule by mapping over the fixed day order. */
function buildWeek(
  builder: (code: keyof HorarioSemanal) => HorarioDia
): HorarioSemanal {
  return {
    lun: builder("lun"),
    mar: builder("mar"),
    mie: builder("mie"),
    jue: builder("jue"),
    vie: builder("vie"),
    sab: builder("sab"),
    dom: builder("dom"),
  };
}

describe("formatHorario — group-then-join rules", () => {
  it("renders 'Lun a Dom 8:00 a 22:00' when all 7 days share the same hours", () => {
    const week = buildWeek(() => open("08:00", "22:00"));
    expect(formatHorario(week)).toBe("Lun a Dom 8:00 a 22:00");
  });

  it("renders 3 groups when Mon-Fri are 8-22, Sat is 9-14, Sun is closed", () => {
    const week = buildWeek((code) => {
      if (code === "sab") return open("09:00", "14:00");
      if (code === "dom") return closed();
      return open("08:00", "22:00");
    });
    expect(formatHorario(week)).toBe(
      "Lun a Vie 8:00 a 22:00 · Sáb 9:00 a 14:00 · Dom cerrado"
    );
  });

  it("returns null when all 7 days are closed (hides the section)", () => {
    const week = buildWeek(() => closed());
    expect(formatHorario(week)).toBeNull();
  });

  it("renders 7 individual groups when every day has different hours", () => {
    const week = buildWeek((code) => {
      const hours: Record<keyof HorarioSemanal, [string, string]> = {
        lun: ["08:00", "12:00"],
        mar: ["09:00", "18:00"],
        mie: ["10:00", "20:00"],
        jue: ["07:00", "13:00"],
        vie: ["11:00", "19:00"],
        sab: ["12:00", "16:00"],
        dom: ["13:00", "17:00"],
      };
      return open(hours[code][0], hours[code][1]);
    });
    expect(formatHorario(week)).toBe(
      "Lun 8:00 a 12:00 · Mar 9:00 a 18:00 · Mié 10:00 a 20:00 · " +
        "Jue 7:00 a 13:00 · Vie 11:00 a 19:00 · Sáb 12:00 a 16:00 · Dom 13:00 a 17:00"
    );
  });

  it("renders 'Lun a Vie …' + 'Sáb y Dom cerrado' when weekdays open and weekend closed", () => {
    const week = buildWeek((code) => {
      if (code === "sab" || code === "dom") return closed();
      return open("08:00", "22:00");
    });
    expect(formatHorario(week)).toBe(
      "Lun a Vie 8:00 a 22:00 · Sáb y Dom cerrado"
    );
  });

  it("renders 3 groups when only Wednesday is open (Mon-Tue closed, Thu-Sun closed)", () => {
    // Algorithm is consistent: adjacent closed days are grouped, even
    // when split by a single open day. The user sees a predictable
    // decomposition of their week, not a special-cased collapse.
    // (All-7-closed is the ONLY case that returns null; see above.)
    const week = buildWeek((code) => (code === "mie" ? open("08:00", "22:00") : closed()));
    expect(formatHorario(week)).toBe(
      "Lun y Mar cerrado · Mié 8:00 a 22:00 · Jue a Dom cerrado"
    );
  });
});

describe("formatHorario — edge cases (documented v1 behavior)", () => {
  it("renders a zero-length day (apertura === cierre) verbatim", () => {
    // The form does not validate this; if a user enters the same
    // apertura and cierre, the formatter displays it literally. The
    // caller can filter at the form level if they care.
    const week = buildWeek(() => open("09:00", "09:00"));
    expect(formatHorario(week)).toBe("Lun a Dom 9:00 a 9:00");
  });

  it("does NOT handle cross-midnight schedules (apertura > cierre renders literally)", () => {
    // v1 limitation: apertura > cierre (e.g. 22:00 → 02:00) is allowed
    // at the data level but the formatter does NOT adjust the display.
    // This test documents the current behavior so any future change is
    // a deliberate breaking change. v2 can add a `cierreSiguienteDia`
    // flag to render "Lun 22:00 a Mar 02:00" properly. Note the
    // leading zero is still stripped from the closure (2:00, not 02:00).
    const week = buildWeek(() => open("22:00", "02:00"));
    expect(formatHorario(week)).toBe("Lun a Dom 22:00 a 2:00");
  });

  it("does NOT merge adjacent open days when their hours differ", () => {
    // Mon 8-12 and Tue 14-20 are consecutive but have different hours —
    // they should render as 2 groups, not "Lun a Mar 8-12 / 14-20".
    // The 5 closed days (Wed-Sun) collapse into a single range.
    const week = buildWeek((code) => {
      if (code === "lun") return open("08:00", "12:00");
      if (code === "mar") return open("14:00", "20:00");
      return closed();
    });
    expect(formatHorario(week)).toBe(
      "Lun 8:00 a 12:00 · Mar 14:00 a 20:00 · Mié a Dom cerrado"
    );
  });

  it("renders a single closed day alone (only Dom closed, all others open with same hours)", () => {
    const week = buildWeek((code) =>
      code === "dom" ? closed() : open("08:00", "22:00")
    );
    expect(formatHorario(week)).toBe(
      "Lun a Sáb 8:00 a 22:00 · Dom cerrado"
    );
  });
});
