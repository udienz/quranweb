"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/client";
import { matchesQuery } from "@/lib/search-text";
import { useDismiss } from "@/lib/useDismiss";

export interface ChoiceOption {
  value: string;
  label: string;
  /** Options with the same group are listed under it, in the order the groups first appear. */
  group?: string;
  /** More words the search looks at (for example a language's name in its own language). */
  keywords?: string;
  /** The language of the label, when it is not the interface's (a language's own name); such a label is not machine translated. */
  lang?: string;
}

/** Lists of more than this many options get a search box (we decided on 10, issue #128); shorter ones stay a plain select. */
export const SEARCH_THRESHOLD = 10;

const defaultSelectClass = "w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";
const defaultTriggerClass =
  "flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-background px-3 py-2 text-start text-sm outline-none focus:border-primary";

/** The options grouped, keeping the order of the list. */
function grouped(options: ChoiceOption[]): { group: string | undefined; options: ChoiceOption[] }[] {
  const out: { group: string | undefined; options: ChoiceOption[] }[] = [];
  for (const option of options) {
    const last = out[out.length - 1];
    const existing = out.find((g) => g.group === option.group);
    if (last && last.group === option.group) last.options.push(option);
    else if (existing && option.group !== undefined) existing.options.push(option);
    else out.push({ group: option.group, options: [option] });
  }
  return out;
}

/**
 * A choice from a list. Up to SEARCH_THRESHOLD options it is a plain `<select>` (with `<optgroup>`s); a longer list is a button
 * that opens a search box over the options (the ARIA combobox pattern: arrow keys, Home and End move, Enter chooses, Escape
 * closes). With `name` it also sends its value in a form, like a select. The search ignores case and diacritics.
 */
export default function SearchableSelect({
  options,
  value,
  onChange,
  label,
  labelHidden = false,
  placeholder,
  name,
  selectClassName = defaultSelectClass,
  triggerClassName = defaultTriggerClass,
  labelClassName = "mb-1 block font-medium",
  threshold = SEARCH_THRESHOLD,
}: {
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  /** Keep the label for screen readers only. */
  labelHidden?: boolean;
  /** Shown while nothing is chosen (`value` is ""), and not a choice itself. */
  placeholder?: string;
  /** Form field name: the value is submitted with the form. */
  name?: string;
  selectClassName?: string;
  triggerClassName?: string;
  labelClassName?: string;
  threshold?: number;
}) {
  const { t } = useI18n();
  const id = useId();
  const labelId = `${id}-label`;
  const labelClass = labelHidden ? "sr-only" : labelClassName;

  if (options.length <= threshold) {
    return (
      <div className="text-sm">
        <label htmlFor={`${id}-select`} id={labelId} className={labelClass}>
          {label}
        </label>
        <select id={`${id}-select`} name={name} value={value} onChange={(e) => onChange(e.target.value)} className={selectClassName}>
          {placeholder !== undefined && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {grouped(options).map((g, i) =>
            g.group === undefined ? (
              g.options.map((o) => (
                <option key={o.value} value={o.value} lang={o.lang} translate={o.lang ? "no" : undefined}>
                  {o.label}
                </option>
              ))
            ) : (
              <optgroup key={`${g.group}-${i}`} label={g.group}>
                {g.options.map((o) => (
                  <option key={o.value} value={o.value} lang={o.lang} translate={o.lang ? "no" : undefined}>
                    {o.label}
                  </option>
                ))}
              </optgroup>
            ),
          )}
        </select>
      </div>
    );
  }

  return (
    <Combobox
      id={id}
      options={options}
      value={value}
      onChange={onChange}
      label={label}
      labelClass={labelClass}
      placeholder={placeholder}
      name={name}
      triggerClassName={triggerClassName}
      searchLabel={t("common.search")}
      noMatches={t("common.noMatches")}
    />
  );
}

function Combobox({
  id,
  options,
  value,
  onChange,
  label,
  labelClass,
  placeholder,
  name,
  triggerClassName,
  searchLabel,
  noMatches,
}: {
  id: string;
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  label: string;
  labelClass: string;
  placeholder?: string;
  name?: string;
  triggerClassName: string;
  searchLabel: string;
  noMatches: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const labelId = `${id}-label`;
  const listId = `${id}-list`;
  const optionId = (i: number) => `${id}-option-${i}`;

  const close = useCallback((focusTrigger = false) => {
    setOpen(false);
    setQuery("");
    if (focusTrigger) trigger.current?.focus();
  }, []);
  const dismiss = useCallback(() => close(), [close]);
  useDismiss(open, dismiss, box);

  const filtered = useMemo(() => options.filter((o) => matchesQuery(`${o.label} ${o.keywords ?? ""} ${o.group ?? ""}`, query)), [options, query]);
  const groups = useMemo(() => grouped(filtered), [filtered]);
  // The options in the order they are shown (grouped), which the arrow keys follow.
  const shown = useMemo(() => groups.flatMap((g) => g.options), [groups]);
  const indexOf = useMemo(() => new Map(shown.map((o, i) => [o.value, i])), [shown]);
  const current = options.find((o) => o.value === value);

  // Open on the chosen option, and keep the active one in view as it moves.
  function openList() {
    setActive(Math.max(0, grouped(options).flatMap((g) => g.options).findIndex((o) => o.value === value)));
    setOpen(true);
  }
  useEffect(() => {
    if (!open) return;
    list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const choose = (option: ChoiceOption | undefined) => {
    if (!option) return;
    onChange(option.value);
    close(true);
  };

  function onKeyDown(e: React.KeyboardEvent) {
    const last = shown.length - 1;
    if (e.key === "ArrowDown") setActive((i) => Math.min(last, i + 1));
    else if (e.key === "ArrowUp") setActive((i) => Math.max(0, i - 1));
    else if (e.key === "Home") setActive(0);
    else if (e.key === "End") setActive(Math.max(0, last));
    else if (e.key === "Enter") choose(shown[active]);
    else if (e.key === "Escape") close(true);
    else if (e.key === "Tab") close();
    else return;
    if (e.key !== "Tab") e.preventDefault();
  }

  return (
    <div ref={box} className="relative text-sm">
      <span id={labelId} className={labelClass}>
        {label}
      </span>
      {name !== undefined && <input type="hidden" name={name} value={value} />}
      <button
        ref={trigger}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelId} ${id}-value`}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "ArrowUp") {
            e.preventDefault();
            openList();
          }
        }}
        className={triggerClassName}
      >
        <span id={`${id}-value`} lang={current?.lang} translate={current?.lang ? "no" : undefined} className="truncate">
          {current?.label ?? placeholder ?? value}
        </span>
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="shrink-0">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute start-0 top-full z-40 mt-1 w-full min-w-64 rounded-xl border border-border bg-card p-2 text-foreground shadow-lg">
          <input
            type="search"
            role="combobox"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onKeyDown}
            aria-label={searchLabel}
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={shown.length > 0 ? optionId(active) : undefined}
            placeholder={searchLabel}
            className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-1.5 outline-none focus:border-primary"
          />
          <ul ref={list} id={listId} role="listbox" aria-labelledby={labelId} className="thin-scroll max-h-72 overflow-y-auto">
            {filtered.length === 0 && (
              <li role="presentation" className="px-2 py-3 text-muted-foreground">
                {noMatches}
              </li>
            )}
            {groups.map((g, gi) => (
              <li key={`${g.group ?? ""}-${gi}`} role="presentation">
                {g.group !== undefined && (
                  <p id={`${id}-group-${gi}`} className="px-2 pb-1 pt-1.5 text-xs font-semibold text-muted-foreground">
                    {g.group}
                  </p>
                )}
                <ul role="group" aria-labelledby={g.group !== undefined ? `${id}-group-${gi}` : undefined}>
                  {g.options.map((o) => {
                    const i = indexOf.get(o.value) ?? 0;
                    return (
                      <li
                        key={o.value}
                        id={optionId(i)}
                        data-index={i}
                        role="option"
                        aria-selected={o.value === value}
                        lang={o.lang} translate={o.lang ? "no" : undefined}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => choose(o)}
                        onMouseMove={() => setActive(i)}
                        className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 ${
                          i === active ? "bg-background" : ""
                        } ${o.value === value ? "font-semibold text-primary" : ""}`}
                      >
                        <span>{o.label}</span>
                        {o.value === value && (
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
