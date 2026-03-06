"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface Heading {
  id:    string;
  text:  string;
  level: number;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId]   = useState<string>("");
  // Ref to the scrollable <ul> so we can programmatically scroll it
  const listRef                   = useRef<HTMLUListElement>(null);
  // Refs map: heading id → <li> element, used to scroll the active item into view
  const itemRefs                  = useRef<Map<string, HTMLLIElement>>(new Map());

  // ── 1. Observe headings in the article ──────────────────────────────────
  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 },
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  // ── 2. Auto-scroll the TOC list so the active item stays visible ────────
  useEffect(() => {
    if (!activeId) return;

    const list    = listRef.current;
    const itemEl  = itemRefs.current.get(activeId);
    if (!list || !itemEl) return;

    // scrollIntoView on the item relative to the list container
    const listTop    = list.scrollTop;
    const listBottom = listTop + list.clientHeight;
    const itemTop    = itemEl.offsetTop;
    const itemBottom = itemTop + itemEl.offsetHeight;

    if (itemTop < listTop) {
      // Item is above the visible area — scroll up with a little breathing room
      list.scrollTo({ top: itemTop - 12, behavior: "smooth" });
    } else if (itemBottom > listBottom) {
      // Item is below the visible area — scroll down
      list.scrollTo({ top: itemBottom - list.clientHeight + 12, behavior: "smooth" });
    }
  }, [activeId]);

  if (headings.length < 2) return null;

  return (
    <nav aria-label="Table of contents" className="flex flex-col min-h-0">
      {/* Label */}
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mb-3 shrink-0">
        On this page
      </p>

      {/*
        Scrollable list:
          • max-h caps height so it never overflows the viewport
          • overflow-y-auto enables scrolling
          • overscroll-contain prevents scroll from leaking to the page
          • pr-1 keeps the scrollbar from overlapping the text
          • The scrollbar is styled to be subtle
      */}
      <ul
        ref={listRef}
        className={cn(
          "overflow-y-auto overscroll-contain pr-1 space-y-0.5",
          // Limit height: sticky top-24 + some breathing room = ~calc(100vh - 8rem)
          "max-h-[calc(100vh-10rem)]",
          // Subtle custom scrollbar via Tailwind arbitrary
          "[&::-webkit-scrollbar]:w-1",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-border",
          "scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border",
        )}
      >
        {headings.map(({ id, text, level }) => (
          <li
            key={id}
            ref={(el) => {
              if (el) itemRefs.current.set(id, el);
              else    itemRefs.current.delete(id);
            }}
            style={{ paddingLeft: level === 3 ? "0.75rem" : "0" }}
          >
            <a
              href={`#${id}`}
              onClick={(e) => {
                e.preventDefault();
                const el = document.getElementById(id);
                if (el) {
                  const top = el.getBoundingClientRect().top + window.scrollY - 88;
                  window.scrollTo({ top, behavior: "smooth" });
                  setActiveId(id);
                }
              }}
              className={cn(
                "block text-xs leading-snug py-1 border-l-2 pl-3 transition-all duration-150",
                activeId === id
                  ? "border-foreground text-foreground font-medium"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground",
              )}
            >
              {text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}