"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ColorSwatch } from "./ColorSwatch";
import { Spinner } from "./Spinner";
import type { ColorOption } from "./MixtureColorBuilder";

function labelFor(c: ColorOption) {
  return [c.brand, c.code, c.name].filter(Boolean).join(" · ");
}

/**
 * Color multi-select for the search page. Builds a shareable URL
 * (/search?ids=…&mode=all|any) so results are just server-rendered.
 */
export function SearchColorPicker({
  colors,
  initialIds,
  initialMode,
}: {
  colors: ColorOption[];
  initialIds: string[];
  initialMode: "all" | "any";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedIds, setSelectedIds] = useState<string[]>(initialIds);
  const [mode, setMode] = useState<"all" | "any">(initialMode);
  const [query, setQuery] = useState("");

  const byId = useMemo(() => new Map(colors.map((c) => [c.id, c])), [colors]);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return colors
      .filter((c) => !selectedSet.has(c.id))
      .filter((c) => q === "" || labelFor(c).toLowerCase().includes(q))
      .slice(0, 8);
  }, [colors, query, selectedSet]);

  function submit(ids: string[], m: "all" | "any") {
    const params = new URLSearchParams();
    if (ids.length) params.set("ids", ids.join(","));
    params.set("mode", m);
    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  function add(id: string) {
    const next = [...selectedIds, id];
    setSelectedIds(next);
    setQuery("");
  }
  function remove(id: string) {
    setSelectedIds((ids) => ids.filter((x) => x !== id));
  }

  return (
    <div className="card flex flex-col gap-4 p-4">
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="הוספת צבע לחיפוש…"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />
        {query.trim() !== "" && matches.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-surface shadow-lg">
            {matches.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => add(c.id)}
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

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const c = byId.get(id);
            if (!c) return null;
            return (
              <span
                key={id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pe-2 ps-1 text-sm"
              >
                <ColorSwatch color={c} size="sm" />
                {c.name}
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="text-muted hover:text-red-600"
                  aria-label="הסרה"
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex overflow-hidden rounded-lg border border-border text-sm">
          <button
            type="button"
            onClick={() => setMode("all")}
            className={`px-3 py-1.5 ${mode === "all" ? "bg-primary text-primary-foreground" : "bg-surface"}`}
          >
            כל הצבעים
          </button>
          <button
            type="button"
            onClick={() => setMode("any")}
            className={`px-3 py-1.5 ${mode === "any" ? "bg-primary text-primary-foreground" : "bg-surface"}`}
          >
            לפחות אחד
          </button>
        </div>

        <button
          type="button"
          onClick={() => submit(selectedIds, mode)}
          disabled={selectedIds.length === 0 || isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-40"
        >
          {isPending && <Spinner className="h-4 w-4" />}
          {isPending ? "מחפש…" : "חיפוש"}
        </button>

        <span className="text-xs text-muted">
          {mode === "all"
            ? "ערבובים שמכילים את כל הצבעים שנבחרו"
            : "ערבובים שמכילים לפחות אחד מהצבעים"}
        </span>
      </div>

      {isPending && (
        <div
          className="flex items-center gap-2 text-sm text-muted"
          aria-live="polite"
        >
          <Spinner className="h-4 w-4" />
          מחפש ערבובים…
        </div>
      )}
    </div>
  );
}
