"use client";

import { useEffect, useMemo, useState } from "react";
import { ColorSwatch } from "./ColorSwatch";
import { NewColorDialog } from "./NewColorDialog";

export type ColorOption = {
  id: string;
  name: string;
  brand: string | null;
  code: string | null;
  hex: string | null;
  imageUrl: string | null;
};

type Selected = { color: ColorOption; amount: string; unit: string };

const UNITS = [
  { value: "parts", label: "חלקים" },
  { value: "grams", label: "גרם" },
  { value: "%", label: "אחוז" },
];

// How many matches to show at first, and how many more to reveal each time the
// list is scrolled near the bottom (smart/lazy loading).
const BATCH = 20;

function labelFor(c: ColorOption) {
  return [c.brand, c.code, c.name].filter(Boolean).join(" · ");
}

/**
 * Lets the user assemble a mixture: search + add colors, optionally record an
 * amount/unit per color. Serializes the selection into hidden inputs consumed
 * by the createMixture server action.
 */
export type InitialComponent = {
  glazeColorId: string;
  amount: number | null;
  unit: string | null;
};

export function MixtureColorBuilder({
  colors,
  initialColorIds,
  initialComponents,
}: {
  colors: ColorOption[];
  initialColorIds?: string[];
  /** Pre-fill the builder for editing: colors with their recorded amount/unit. */
  initialComponents?: InitialComponent[];
}) {
  const [selected, setSelected] = useState<Selected[]>(() => {
    const byId = new Map(colors.map((c) => [c.id, c]));
    if (initialComponents && initialComponents.length > 0) {
      return initialComponents
        .map((comp) => {
          const color = byId.get(comp.glazeColorId);
          if (!color) return undefined;
          return {
            color,
            amount: comp.amount != null ? String(comp.amount) : "",
            unit: comp.unit ?? "parts",
          };
        })
        .filter((s): s is Selected => s !== undefined);
    }
    return (initialColorIds ?? [])
      .map((id) => byId.get(id))
      .filter((c): c is ColorOption => c !== undefined)
      .map((color) => ({ color, amount: "", unit: "parts" }));
  });
  const [query, setQuery] = useState("");
  // When the input is focused we open the list even with an empty query, so the
  // user can browse the available colors without typing.
  const [focused, setFocused] = useState(false);
  const [recordAmounts, setRecordAmounts] = useState(
    () => initialComponents?.some((c) => c.amount != null) ?? false,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  // Trails `query` by ~600ms; when it catches up, the user has stopped typing.
  // Used to prompt "save this color?" only after they pause, not per keystroke.
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const selectedIds = useMemo(
    () => new Set(selected.map((s) => s.color.id)),
    [selected],
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colors
      .filter((c) => !selectedIds.has(c.id))
      .filter((c) => q === "" || labelFor(c).toLowerCase().includes(q));
  }, [colors, query, selectedIds]);

  // Smart loading: render only the first `visibleCount` matches, growing as the
  // list is scrolled. Reset to the first batch whenever the query changes
  // (adjusting state during render, per the React "you might not need an
  // effect" guidance).
  const [visibleCount, setVisibleCount] = useState(BATCH);
  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setVisibleCount(BATCH);
  }

  function onListScroll(e: React.UIEvent<HTMLUListElement>) {
    const el = e.currentTarget;
    if (
      el.scrollTop + el.clientHeight >= el.scrollHeight - 80 &&
      visibleCount < matches.length
    ) {
      setVisibleCount((n) => n + BATCH);
    }
  }

  // Debounce: `debouncedQuery` catches up to `query` ~600ms after the last
  // keystroke, signalling the user has stopped typing.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 600);
    return () => clearTimeout(t);
  }, [query]);

  const showCreatePrompt =
    query.trim() !== "" && matches.length === 0 && debouncedQuery === query;

  function add(color: ColorOption) {
    setSelected((s) => [...s, { color, amount: "", unit: "parts" }]);
    setQuery("");
  }
  function remove(id: string) {
    setSelected((s) => s.filter((x) => x.color.id !== id));
  }
  function update(id: string, patch: Partial<Selected>) {
    setSelected((s) =>
      s.map((x) => (x.color.id === id ? { ...x, ...patch } : x)),
    );
  }

  const componentsPayload = JSON.stringify(
    selected.map((s) => {
      // Only record a positive amount; anything else (blank, 0 from the slider
      // resting at its start, negatives) counts as "no amount recorded" — the
      // validator rejects non-positive numbers.
      const n = Number(s.amount);
      const amount =
        recordAmounts && s.amount !== "" && n > 0 ? n : null;
      return {
        glazeColorId: s.color.id,
        amount,
        unit: recordAmounts ? s.unit : null,
      };
    }),
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
          onFocus={() => setFocused(true)}
          // Delay so a click on an option registers before the list unmounts.
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          placeholder="חיפוש צבע להוספה…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {focused && matches.length > 0 && (
          <ul
            onScroll={onListScroll}
            className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-surface shadow-lg"
          >
            {matches.slice(0, visibleCount).map((c) => (
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

        {showCreatePrompt && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-border bg-surface p-3 shadow-lg">
            <p className="text-sm text-muted">
              לא נמצא צבע בשם ״{query.trim()}״.
            </p>
            <button
              type="button"
              onClick={() => setDialogOpen(true)}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              <span aria-hidden>➕</span>
              <span>לשמור את הצבע במערכת?</span>
            </button>
          </div>
        )}
      </div>

      {dialogOpen && (
        <NewColorDialog
          initialName={query.trim()}
          onClose={() => setDialogOpen(false)}
          onCreated={(color) => {
            add(color);
            setDialogOpen(false);
          }}
        />
      )}

      {/* toggle amounts */}
      <label className="flex items-center gap-2 text-sm text-muted">
        <input
          type="checkbox"
          checked={recordAmounts}
          onChange={(e) => setRecordAmounts(e.target.checked)}
        />
        רישום כמויות / יחסים (לא חובה)
      </label>

      {/* selected list */}
      {selected.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-3 text-sm text-muted">
          עדיין לא נבחרו צבעים. צריך לפחות אחד.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {selected.map((s) => (
            <li
              key={s.color.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2"
            >
              <ColorSwatch color={s.color} size="sm" />
              <span className="flex-1 text-sm">{labelFor(s.color)}</span>
              {recordAmounts && (
                <>
                  {s.unit === "%" ? (
                    // Percent → drag a slider (0–100). Clearer than typing, and
                    // the value is still stored as a plain number string.
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={s.amount === "" ? 0 : s.amount}
                        onChange={(e) =>
                          update(s.color.id, { amount: e.target.value })
                        }
                        className="flex-1 accent-primary"
                        aria-label="אחוז"
                      />
                      <span className="w-10 text-end text-sm tabular-nums text-muted">
                        {s.amount === "" ? 0 : s.amount}%
                      </span>
                    </div>
                  ) : (
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={s.amount}
                      onChange={(e) =>
                        update(s.color.id, { amount: e.target.value })
                      }
                      placeholder="כמות"
                      className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:border-primary"
                    />
                  )}
                  <select
                    value={s.unit}
                    onChange={(e) => update(s.color.id, { unit: e.target.value })}
                    className="rounded-md border border-border bg-background px-2 py-1 text-sm"
                  >
                    {UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
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
