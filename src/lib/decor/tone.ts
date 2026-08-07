// the page has no theme switch to hook into — <html> is pinned dark, and the
// projects panel's light background is a local override, not a theme change.
// every mount site says explicitly what it's sitting on, so this one function
// is the only place the contrast rule can drift from.

export type DecorTone = "on-dark" | "on-light";

export function decorInk(tone: DecorTone) {
  return tone === "on-dark" ? "#ffffff" : "#0a0a12";
}
