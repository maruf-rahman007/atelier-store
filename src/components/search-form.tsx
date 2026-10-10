"use client";

import Form from "next/form";
import { useSearchParams } from "next/navigation";
import { SearchIcon } from "@/components/icons";
import { normaliseQuery, SEARCH_QUERY_MAX_LENGTH } from "@/lib/products";

/* GET form to /search: client navigation with JS, a plain form without.
 * Reads the query from the URL so the field keeps it while results load. */
export function SearchForm() {
  const query = normaliseQuery(useSearchParams().get("q") ?? undefined);
  return <SearchFields key={query} query={query} />;
}

/* Static stand-in while the URL is read (the prerendered shell). */
export function SearchFormFallback() {
  return <SearchFields query="" />;
}

function SearchFields({ query }: { query: string }) {
  return (
    <Form action="/search" role="search" className="flex w-full md:max-w-lg">
      <label className="relative flex-1">
        <span className="sr-only">Search products</span>
        <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          autoFocus={query === ""}
          maxLength={SEARCH_QUERY_MAX_LENGTH}
          placeholder="Coats, leather, ivory…"
          autoComplete="off"
          enterKeyHint="search"
          className="h-12 w-full border border-r-0 border-line-strong bg-canvas pl-12 pr-4 text-body-lg placeholder:text-ink-subtle transition-colors duration-150 hover:border-ink focus-visible:border-ink"
        />
      </label>
      <button type="submit" className="btn btn-primary">
        Search
      </button>
    </Form>
  );
}
