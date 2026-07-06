"use client";

import { useEffect, useMemo, useState } from "react";
import { ColorSwatch } from "./ColorSwatch";
import { UNITS, type Unit } from "@/lib/units";

export type ColorOption = {
  id: string;
  name: string;
  brand: string | null;
  code: string | null;
  hex: string | null;
  imageUrl: string | null;
};

type Selected = { color: ColorOption; amount: string };

const BAR_FALLBACK = "#9ca3af";

function labelFor(c: ColorOption) {
  return [c.brand, c.code, c.name].filter(Boolean).join(" · ");
}

/**
 * Lets the user assemble a mixture: search + add colors, optionally record
 * amounts. A single unit (parts / grams / %) applies to the whole mixture. When
 * the unit is "%", a stacked color bar + sliders help the user reach exactly
 * 100%. Serializes the selection into a hidden input consumed by createMixture.
 */
export function MixtureColorBuilder({
  colors,
  initialColorIds,
  onAmountsValidityChange,
}: {
  colors: ColorOption[];
  initialColorIds?: string[];
  onAmountsValidityChange?: (valid: boolean) => void;
}) {
  const [selected, setSelected] = useState<Selected[]>(() => {
    const byId = new Map(colors.map((c) => [c.id, c]));
    return (initialColorIds ?? [])
      .map((id) => byId.get(id))
      .filter((c): c is ColorOption => c !== undefined)
      .map((color) => ({ color, amount: "" }));
  });
  const [query, setQuery] = useState("");
  const [recordAmounts, setRecordAmounts] = useState(false);
  const [unit, setUnit] = useState<Unit>("parts");

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.color.id)),
    [selected],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colors
      .filter((c) => !selectedIds.has(c.id))
      .filter((c) => q === "" || labelFor(c).toLowerCase().includes(q))
      .slice(0, 8);
  }, [colors, query, selectedIds]);

  function add(color: ColorOption) {
    setSelected((s) => [...s, { color, amount: "" }]);
    setQuery("");
  }
  function remove(id: string) {
    setSelected((s) => s.filter((x) => x.color.id !== id));
  }
  function setAmount(id: string, amount: string) {
    setSelected((s) =>
      s.map((x) => (x.color.id === id ? { ...x, amount } : x)),
    );
  }

  const amounts = selected.map((s) => Number(s.amount) || 0);
  const total = amounts.reduce((acc, n) => acc + n, 0);
  const isPercent = unit === "%";
  const percentExact = Math.abs(total - 100) < 0.01;

  // Distribute 100% evenly across the selected colors (integers, sum stays 100).
  function distributeEvenly() {
    const n = selected.length;
    if (n === 0) return;
    const base = Math.floor(100 / n);
    const remainder = 100 - base * n;
    setSelected((s) =>
      s.map((x, i) => ({ ...x, amount: String(base + (i < remainder ? 1 : 0)) })),
    );
  }

  // Amounts are only "invalid" when recording percentages that don't sum to 100.
  const amountsValid = !recordAmounts || !isPercent || percentExact;
  useEffect(() => {
    onAmountsValidityChange?.(amountsValid);
  }, [amountsValid, onAmountsValidityChange]);

  const componentsPayload = JSON.stringify(
    selected.map((s) => ({
      glazeColorId: s.color.id,
      amount: recordAmounts && s.amount !== "" ? Number(s.amount) : null,
      unit: recordAmounts ? unit : null,
    })),
  );

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        צבעים בערבוב <span className="text-primary">*</span>
      </label>

      {/* search + add */}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש צבע להוספה…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {query.trim() !== "" && matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            {matches.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => add(c)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-start text-sm hover:bg-background"
                >
                  <ColorSwatch color={c} size="sm" />
                  <span>{labelFor(c)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* toggle amounts */}
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={recordAmounts}
          onChange={(e) => setRecordAmounts(e.target.checked)}
        />
        רישום כמויות / יחסים (לא חובה)
      </label>

      {recordAmounts && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted">יחידת מידה:</span>
          <div className="inline-flex overflow-hidden rounded-lg border border-border">
            {UNITS.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => setUnit(u.value)}
                aria-pressed={unit === u.value}
                className={`px-3 py-1.5 text-sm transition ${
                  unit === u.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface text-foreground hover:bg-background"
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>
          {isPercent && selected.length > 0 && (
            <button
              type="button"
              onClick={distributeEvenly}
              className="ms-auto rounded-md border border-border px-2.5 py-1 text-xs text-muted hover:bg-background"
            >
              חלוקה שווה
            </button>
          )}
        </div>
      )}

      {/* stacked color bar + total meter (percent mode) */}
      {recordAmounts && isPercent && selected.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex h-3 w-full overflow-hidden rounded-full bg-background">
            {selected.map((s, i) => {
              const denom = Math.max(total, 100);
              const width = denom > 0 ? (amounts[i] / denom) * 100 : 0;
              return (
                <div
                  key={s.color.id}
                  style={{
                    width: `${width}%`,
                    backgroundColor: s.color.hex ?? BAR_FALLBACK,
                  }}
                  title={`${labelFor(s.color)} — ${amounts[i]}%`}
                />
              );
            })}
          </div>
          <p
            className={`text-sm font-medium ${
              percentExact
                ? "text-green-600"
                : total > 100
                  ? "text-red-600"
                  : "text-amber-600"
            }`}
          >
            {percentExact
              ? "סה״כ: 100% ✓"
              : total > 100
                ? `סה״כ: ${Math.round(total * 100) / 100}% (חריגה של ${Math.round((total - 100) * 100) / 100}%)`
                : `סה״כ: ${Math.round(total * 100) / 100}% (נותרו ${Math.round((100 - total) * 100) / 100}%)`}
          </p>
        </div>
      )}

      {/* running total (parts / grams mode) */}
      {recordAmounts && !isPercent && total > 0 && (
        <p className="text-sm text-muted">
          סה&#x5f4;כ: {Math.round(total * 100) / 100}{" "}
          {UNITS.find((u) => u.value === unit)?.short}
        </p>
      )}

      {/* selected list */}
      {selected.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted">
          עדיין לא נבחרו צבעים. צריך לפחות שניים.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {selected.map((s, i) => (
            <li
              key={s.color.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2"
            >
              <ColorSwatch color={s.color} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm">
                {labelFor(s.color)}
              </span>
              {recordAmounts && (
                <>
                  {isPercent && (
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="1"
                      value={amounts[i]}
                      onChange={(e) => setAmount(s.color.id, e.target.value)}
                      className="hidden w-28 accent-primary sm:block"
                      aria-label={`אחוז עבור ${labelFor(s.color)}`}
                    />
                  )}
                  <input
                    type="number"
                    min="0"
                    max={isPercent ? "100" : undefined}
                    step={isPercent ? "1" : "any"}
                    value={s.amount}
                    onChange={(e) => setAmount(s.color.id, e.target.value)}
                    placeholder={isPercent ? "%" : "כמות"}
                    className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                  />
                </>
              )}
              <button
                type="button"
                onClick={() => remove(s.color.id)}
                className="rounded-md px-2 py-1 text-sm text-muted hover:text-red-600"
                aria-label="הסרה"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <input type="hidden" name="components" value={componentsPayload} />
    </div>
  );
}
