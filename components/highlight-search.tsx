"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function HighlightSearch() {
  const searchParams = useSearchParams();
  const sq = searchParams.get("sq");

  useEffect(() => {
    if (!sq) return;

    // A simple text node highlighter
    const term = sq.toLowerCase();
    
    // We only want to highlight inside main content areas
    const main = document.querySelector("main");
    if (!main) return;

    const highlightTextNodes = (node: Node) => {
      // Skip script, style, and already marked elements
      if (
        node.nodeName === "SCRIPT" ||
        node.nodeName === "STYLE" ||
        node.nodeName === "MARK"
      ) {
        return;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent;
        if (!text) return;

        const lowerText = text.toLowerCase();
        const index = lowerText.indexOf(term);

        if (index >= 0) {
          const match = text.substring(index, index + term.length);
          const before = text.substring(0, index);
          const after = text.substring(index + term.length);

          const mark = document.createElement("mark");
          mark.className = "bg-amber-400/40 text-foreground rounded-sm px-0.5 border-b-2 border-amber-500/60";
          mark.textContent = match;

          const fragment = document.createDocumentFragment();
          if (before) fragment.appendChild(document.createTextNode(before));
          fragment.appendChild(mark);
          if (after) {
            // we create a new text node for the rest and highlight it recursively
            const afterNode = document.createTextNode(after);
            fragment.appendChild(afterNode);
            // replace the current node
            node.parentNode?.replaceChild(fragment, node);
            // recursively process the rest
            highlightTextNodes(afterNode);
          } else {
            node.parentNode?.replaceChild(fragment, node);
          }
        }
      } else {
        // recursively process children
        const children = Array.from(node.childNodes);
        for (const child of children) {
          highlightTextNodes(child);
        }
      }
    };

    // Clean up previous marks before applying new ones (if any)
    const marks = main.querySelectorAll("mark");
    marks.forEach(mark => {
      if (mark.className.includes("bg-amber-400")) {
        const parent = mark.parentNode;
        if (parent) {
          parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
          parent.normalize();
        }
      }
    });

    highlightTextNodes(main);

    return () => {
      const currentMarks = main.querySelectorAll("mark");
      currentMarks.forEach(mark => {
        if (mark.className.includes("bg-amber-400")) {
          const parent = mark.parentNode;
          if (parent) {
            parent.replaceChild(document.createTextNode(mark.textContent || ""), mark);
            parent.normalize();
          }
        }
      });
    };
  }, [sq]);

  return null;
}
