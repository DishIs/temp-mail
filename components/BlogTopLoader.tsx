"use client";

import { useEffect } from "react";
import NProgress from "nprogress";
import { usePathname, useSearchParams } from "next/navigation";
import "nprogress/nprogress.css";

// Configure NProgress exactly like nextjs-toploader would
NProgress.configure({
  showSpinner: false,
  trickleSpeed: 200,
  minimum: 0.08,
  easing: "ease",
  speed: 200,
});

export function BlogTopLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Stop NProgress when the route finishes loading
  useEffect(() => {
    NProgress.done();
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.currentTarget as HTMLAnchorElement;
      
      // Get the target href
      const href = target.href;
      
      // Skip if no href or target is different origin or is a new window/tab
      if (
        !href ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        e.defaultPrevented
      ) {
        return;
      }

      try {
        const url = new URL(href);
        const currentUrl = new URL(window.location.href);

        // Only care about same-origin links
        if (url.origin !== currentUrl.origin) return;

        // ONLY trigger for blog pages (/blog or /<locale>/blog)
        const isBlogTarget = url.pathname.includes("/blog");
        
        // If it's the exact same page (hash change), ignore
        if (url.pathname === currentUrl.pathname && url.search === currentUrl.search) {
          return;
        }

        if (isBlogTarget) {
          NProgress.start();
        }
      } catch (err) {
        // Ignore invalid URLs
      }
    };

    // Add click listeners to all anchors
    const mutationObserver = new MutationObserver(() => {
      document.querySelectorAll("a").forEach((anchor) => {
        // Prevent adding multiple listeners
        anchor.removeEventListener("click", handleAnchorClick as any);
        anchor.addEventListener("click", handleAnchorClick as any);
      });
    });

    // Initial setup
    document.querySelectorAll("a").forEach((anchor) => {
      anchor.addEventListener("click", handleAnchorClick as any);
    });

    // Observe body for dynamically added links
    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutationObserver.disconnect();
      document.querySelectorAll("a").forEach((anchor) => {
        anchor.removeEventListener("click", handleAnchorClick as any);
      });
    };
  }, []);

  return (
    <style>{`
      #nprogress {
        pointer-events: none;
      }
      #nprogress .bar {
        background: #2299DD;
        position: fixed;
        z-index: 1600;
        top: 0;
        left: 0;
        width: 100%;
        height: 3px;
      }
      #nprogress .peg {
        display: block;
        position: absolute;
        right: 0px;
        width: 100px;
        height: 100%;
        box-shadow: 0 0 10px #2299DD, 0 0 5px #2299DD;
        opacity: 1;
        -webkit-transform: rotate(3deg) translate(0px, -4px);
        -ms-transform: rotate(3deg) translate(0px, -4px);
        transform: rotate(3deg) translate(0px, -4px);
      }
    `}</style>
  );
}
