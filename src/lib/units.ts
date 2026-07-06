/**
 * Single source of truth for mixture-component units.
 * Shared by the Zod validators, the mixture builder UI, and the detail page so
 * the allowed values and Hebrew labels never drift apart.
 */
export const UNIT_VALUES = ["parts", "grams", "%"] as const;

export type Unit = (typeof UNIT_VALUES)[number];

export const UNITS: { value: Unit; label: string; short: string }[] = [
  { value: "parts", label: "חלקים", short: "חלקים" },
  { value: "grams", label: "גרם", short: "גרם" },
  { value: "%", label: "אחוז", short: "%" },
];

/** Human label for a stored unit value (falls back to the raw value). */
export function unitLabel(u: string): string {
  return UNITS.find((x) => x.value === u)?.short ?? u;
}
