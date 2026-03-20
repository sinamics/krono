"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Search, ArrowLeftRight, Building2, FileText, Loader2 } from "lucide-react";
import { globalSearch, type SearchResult, type SearchResults } from "@/features/search/Actions/globalSearch";

const EMPTY: SearchResults = { transactions: [], suppliers: [], pages: [] };

const CATEGORY_META = {
  transactions: { label: "Transaksjoner", icon: ArrowLeftRight },
  suppliers: { label: "Leverandorer", icon: Building2 },
  pages: { label: "Sider", icon: FileText },
} as const;

type Category = keyof typeof CATEGORY_META;

function flatResults(r: SearchResults): SearchResult[] {
  return [...r.transactions, ...r.suppliers, ...r.pages];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const router = useRouter();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onOpenSearch = () => setOpen(true);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("open-search", onOpenSearch);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("open-search", onOpenSearch);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults(EMPTY);
      setActiveIndex(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults(EMPTY); setLoading(false); return; }
    setLoading(true);
    try {
      const data = await globalSearch(q);
      setResults(data);
      setActiveIndex(0);
    } catch { setResults(EMPTY); }
    finally { setLoading(false); }
  }, []);

  function onInput(value: string) {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 300);
  }

  function navigateTo(href: string) { setOpen(false); router.push(href); }

  const flat = flatResults(results);
  const hasResults = flat.length > 0;

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % (flat.length || 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + (flat.length || 1)) % (flat.length || 1));
    } else if (e.key === "Enter" && flat[activeIndex]) {
      e.preventDefault();
      navigateTo(flat[activeIndex].href);
    }
  }

  function getOffset(category: Category) {
    if (category === "transactions") return 0;
    if (category === "suppliers") return results.transactions.length;
    return results.transactions.length + results.suppliers.length;
  }

  function renderCategory(category: Category) {
    const items = results[category];
    if (items.length === 0) return null;
    const { label, icon: Icon } = CATEGORY_META[category];
    const offset = getOffset(category);
    return (
      <div key={category}>
        <div className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </div>
        {items.map((item, i) => {
          const idx = offset + i;
          return (
            <button
              key={item.id}
              type="button"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm cursor-pointer text-left transition-colors ${idx === activeIndex ? "bg-accent" : "hover:bg-accent"}`}
              onClick={() => navigateTo(item.href)}
              onMouseEnter={() => setActiveIndex(idx)}
            >
              <Icon className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <div className="truncate">{item.title}</div>
                {item.subtitle && (
                  <div className="truncate text-xs text-muted-foreground">{item.subtitle}</div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const kbdClass = "rounded border bg-muted px-1 py-0.5 font-mono text-[10px]";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="p-0 gap-0 sm:max-w-lg overflow-hidden">
        <DialogTitle className="sr-only">Sok</DialogTitle>
        <div className="flex items-center border-b px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => onInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Sok etter transaksjoner, leverandorer, sider..."
            className="flex-1 bg-transparent px-3 py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
          {loading && <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />}
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {query.trim().length >= 2 && !loading && !hasResults && (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Search className="size-8 mb-2 opacity-50" />
              <p className="text-sm">Ingen resultater</p>
            </div>
          )}
          {hasResults && (
            <div className="space-y-2">
              {renderCategory("transactions")}
              {renderCategory("suppliers")}
              {renderCategory("pages")}
            </div>
          )}
        </div>
        <div className="flex items-center justify-center gap-4 border-t px-3 py-2 text-xs text-muted-foreground">
          <span><kbd className={kbdClass}>↑↓</kbd> Naviger</span>
          <span><kbd className={kbdClass}>↵</kbd> Apne</span>
          <span><kbd className={kbdClass}>Esc</kbd> Lukk</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
