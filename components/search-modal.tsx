"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Search, Command, Clock, X, FileText, Rss, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import NProgress from "nprogress";

interface SearchResult {
  title: string;
  url: string;
  description: string;
  type: "api" | "blog";
}

const LOCAL_STORAGE_KEY = "fce_search_history";
const LOCAL_STORAGE_INDEX = "fce_search_index";
const INDEX_EXPIRY = "fce_search_index_expiry";

export function SearchModal({ triggerClass }: { triggerClass?: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [history, setHistory] = useState<SearchResult[]>([]);
  const [indexData, setIndexData] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load history
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  // Keyboard shortcut listener Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Fetch index data once open
  useEffect(() => {
    if (open && indexData.length === 0) {
      const fetchIndex = async () => {
        try {
          const now = Date.now();
          const cachedExpiry = localStorage.getItem(INDEX_EXPIRY);
          const cachedIndex = localStorage.getItem(LOCAL_STORAGE_INDEX);

          if (cachedIndex && cachedExpiry && now < Number(cachedExpiry)) {
            setIndexData(JSON.parse(cachedIndex));
            return;
          }

          setLoading(true);
          const res = await fetch("/api/search-index");
          if (res.ok) {
            const data = await res.json();
            setIndexData(data);
            localStorage.setItem(LOCAL_STORAGE_INDEX, JSON.stringify(data));
            localStorage.setItem(INDEX_EXPIRY, String(now + 1000 * 60 * 60)); // 1 hour expiry
          }
        } catch (e) {
          console.error("Failed to load search index", e);
        } finally {
          setLoading(false);
        }
      };
      fetchIndex();
    }
  }, [open, indexData.length]);

  // Filter results
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = indexData.filter(
      (item) =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
    );
    setResults(filtered);
  }, [query, indexData]);

  const handleSelect = (item: SearchResult) => {
    // Add to history
    const newHistory = [item, ...history.filter((h) => h.url !== item.url)].slice(0, 5);
    setHistory(newHistory);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {}

    setOpen(false);
    const destination = query.trim() ? `${item.url}?sq=${encodeURIComponent(query.trim())}` : item.url;
    setQuery("");
    
    if (destination.includes("/blog")) {
      NProgress.start();
    }
    
    router.push(destination);
  };

  const removeHistoryItem = (e: React.MouseEvent, url: string) => {
    e.stopPropagation();
    const newHistory = history.filter((h) => h.url !== url);
    setHistory(newHistory);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newHistory));
    } catch (e) {}
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 h-8 px-2 md:px-3 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border border-transparent hover:border-border ${triggerClass || ""}`}
        aria-label="Search"
      >
        <Search className="h-4 w-4" />
        <span className="hidden md:flex text-[10px] font-mono border border-border bg-muted/50 px-1.5 py-0.5 rounded text-muted-foreground/80 leading-none items-center gap-0.5">
          <Command className="h-2.5 w-2.5" /> K
        </span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[600px] p-0 gap-0 overflow-hidden bg-background border-border shadow-2xl [&>button]:hidden">
          <DialogTitle className="sr-only">Search Modal</DialogTitle>
          <div className="flex items-center border-b border-border px-3 sm:px-4 py-3">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              autoFocus
              className="flex-1 bg-transparent outline-none px-3 text-sm placeholder:text-muted-foreground text-foreground"
              placeholder="Search API docs, blog posts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <span className="text-[10px] font-mono border border-border bg-muted px-1.5 py-0.5 rounded text-muted-foreground ml-2 hidden sm:inline-flex leading-none">
              ESC
            </span>
          </div>

          <ScrollArea className="max-h-[60vh] overflow-y-auto">
            <div className="p-2 space-y-4 overflow-hidden">
              {query.trim() === "" ? (
                history.length > 0 ? (
                  <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Recent Searches
                    </div>
                    {history.map((item) => (
                      <button
                        key={item.url}
                        onClick={() => handleSelect(item)}
                        className="w-full flex items-center gap-3 px-2 py-2.5 text-sm rounded-md hover:bg-muted/50 transition-colors group text-left overflow-hidden"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="flex-1 line-clamp-2 break-words min-w-0 text-foreground text-sm">{item.title}</span>
                        <span className="text-[10px] font-mono border border-border bg-muted/30 px-1 py-0 rounded text-muted-foreground uppercase tracking-widest hidden sm:block shrink-0">
                          {item.type}
                        </span>
                        <div
                          role="button"
                          onClick={(e) => removeHistoryItem(e, item.url)}
                          className="h-5 w-5 rounded-md flex items-center justify-center text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted transition-all shrink-0 ml-2"
                        >
                          <X className="h-3 w-3" />
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-14 text-center text-sm text-muted-foreground">
                    No recent searches.
                  </div>
                )
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                    Results
                  </div>
                  {results.map((item) => (
                    <button
                      key={item.url}
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-start gap-3 px-2 py-3 text-sm rounded-md hover:bg-muted/50 transition-colors group text-left overflow-hidden"
                    >
                      <div className="mt-0.5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors">
                        {item.type === "api" ? <FileText className="h-4 w-4" /> : <Rss className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <span className="font-medium text-foreground line-clamp-2 break-words">{item.title}</span>
                          <span className="text-[9px] mt-0.5 font-mono border border-border bg-muted/30 px-1 py-0 rounded text-muted-foreground uppercase tracking-widest shrink-0">
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 break-words mt-1">{item.description}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-foreground shrink-0 mt-2 transition-colors" />
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-14 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Search className="h-6 w-6 text-muted-foreground/30 mb-2" />
                  {loading ? "Searching..." : "No results found."}
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
