// Run with `npm test` (Node 22.18+ reads the .ts file directly).
import assert from "node:assert/strict";
import test from "node:test";
import { asDate, jDate, jTime } from "./format.ts";

test("server times with or without a zone read as the same moment", () => {
  const want = Date.UTC(2026, 10, 11, 10, 5);
  for (const s of ["2026-11-11T10:05:00", "2026-11-11T10:05:00Z", "2026-11-11T10:05:00.000000+00:00", "2026-11-11T13:35:00+03:30"]) {
    assert.equal(asDate(s).getTime(), want, s);
  }
});

test("calendar times never throw, even for missing or broken values", () => {
  // Postgres sends "…Z" / "+00:00"; the calendar used to add another "Z" and crash the page.
  assert.match(jTime("2026-11-11T10:05:00Z"), /^[۰-۹]{2}:[۰-۹]{2}$/);
  for (const bad of [null, undefined, "", "not a date", "2026-11-11T10:05:00ZZ"]) {
    assert.equal(jTime(bad), "—");
    assert.equal(jDate(bad), "—");
  }
});
