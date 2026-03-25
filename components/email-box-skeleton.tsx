// components/email-box-skeleton.tsx
// Shown instantly while EmailBoxServer streams the real profile data.
// Mirrors the visual structure of EmailBox so the transition feels seamless.

export function EmailBoxSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-background overflow-hidden animate-pulse">

      {/* ── Top status bar ───────────────────────────────────────────────── */}
      <div className="border-b border-border">
        <div className="flex items-center gap-2 px-4 pt-3 pb-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40 shrink-0" />
          <div className="h-2 w-36 bg-muted rounded" />
          <div className="flex-1" />
          <div className="h-2 w-10 bg-muted rounded" />
        </div>

        {/* ── Email address row ──────────────────────────────────────────── */}
        <div className="flex items-start gap-2 px-4 pb-3 pt-0.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background/50 px-3 py-2">
              <div className="h-2 w-5 bg-muted rounded shrink-0" />
              <div className="h-3 w-52 bg-muted rounded flex-1 max-w-[240px]" />
              <div className="flex-1" />
              <div className="h-2.5 w-2.5 bg-muted/60 rounded shrink-0" />
            </div>
            <div className="h-2 w-44 bg-muted/40 rounded mt-1 ml-1" />
          </div>

          {/* icon buttons */}
          <div className="flex gap-1.5 shrink-0">
            <div className="h-9 w-9 rounded-md border border-border bg-muted/30" />
            <div className="h-9 w-9 rounded-md border border-border bg-muted/30 hidden sm:block" />
            <div className="h-9 w-9 rounded-md border border-border bg-muted/30" />
            <div className="h-9 w-9 rounded-md border border-border bg-muted/30" />
          </div>
        </div>

        {/* ── Action buttons row ─────────────────────────────────────────── */}
        <div
          className="flex gap-px border-t border-border"
          style={{ background: "var(--border)" }}
        >
          {["Refresh", "Change", "Delete", "Manage"].map((label) => (
            <div
              key={label}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background"
            >
              <div className="h-3 w-3 bg-muted rounded" />
              <div className="h-2 w-10 bg-muted rounded hidden sm:block" />
            </div>
          ))}
        </div>

        {/* ── Tab row ───────────────────────────────────────────────────── */}
        <div
          className="flex gap-px border-t border-border"
          style={{ background: "var(--border)" }}
        >
          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background">
            <div className="h-3 w-3 bg-muted rounded" />
            <div className="h-2 w-6 bg-muted rounded" />
          </div>
          <div className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background/60">
            <div className="h-3 w-3 bg-muted/60 rounded" />
            <div className="h-2 w-14 bg-muted/60 rounded" />
          </div>
        </div>
      </div>

      {/* ── Column header ─────────────────────────────────────────────────── */}
      <div
        className="grid items-center border-b border-border bg-muted/20 px-3 py-1.5"
        style={{ gridTemplateColumns: "1.25rem 1fr 3.5rem 4.5rem" }}
      >
        <div className="h-1.5 w-3 bg-muted/50 rounded" />
        <div className="h-1.5 w-24 bg-muted/50 rounded pl-2" />
        <div className="h-1.5 w-8 bg-muted/50 rounded ml-auto" />
        <span />
      </div>

      {/* ── Inbox rows ────────────────────────────────────────────────────── */}
      <div className="divide-y divide-border/50">
        {[
          { senderW: "w-24", subjectW: "w-48", timeW: "w-8" },
          { senderW: "w-32", subjectW: "w-56", timeW: "w-6" },
          { senderW: "w-20", subjectW: "w-40", timeW: "w-10" },
        ].map(({ senderW, subjectW, timeW }, i) => (
          <div
            key={i}
            className="grid items-center px-3 py-2.5 gap-0"
            style={{ gridTemplateColumns: "1.25rem 1fr 3.5rem 4.5rem" }}
          >
            {/* index */}
            <div className="h-2 w-4 bg-muted/30 rounded" />

            {/* sender + subject */}
            <div className="flex flex-col gap-1.5 pl-2 min-w-0">
              <div className="flex items-center gap-2">
                {/* avatar */}
                <div className="h-5 w-5 rounded-full bg-muted shrink-0" />
                <div className={`h-2.5 ${senderW} bg-muted rounded`} />
              </div>
              <div className={`h-2 ${subjectW} bg-muted/60 rounded ml-7`} />
              <div className="h-2 w-28 bg-muted/30 rounded ml-7" />
            </div>

            {/* time */}
            <div className={`h-2 ${timeW} bg-muted/50 rounded ml-auto`} />

            {/* action icons */}
            <div className="flex items-center justify-end gap-0.5 pl-1">
              <div className="h-6 w-6 rounded bg-muted/20" />
              <div className="h-6 w-6 rounded bg-muted/20" />
            </div>
          </div>
        ))}
      </div>

      {/* ── Bottom history section ─────────────────────────────────────────── */}
      <div className="border-t border-border">
        <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
          {/* History list */}
          <div className="flex-1 px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div className="h-2 w-12 bg-muted/50 rounded" />
              <div className="h-2 w-14 bg-muted/30 rounded" />
            </div>
            <div className="space-y-3">
              {[{ w: "w-52" }, { w: "w-44" }, { w: "w-56" }].map(({ w }, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`h-2 ${w} bg-muted/40 rounded`} />
                  <div className="flex-1" />
                  <div className="h-2 w-6 bg-muted/30 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Phone promo card placeholder */}
          <div className="md:w-72 shrink-0 px-4 py-4">
            <div className="rounded-lg border border-border bg-muted/10 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 bg-muted/50 rounded" />
                <div className="h-2 w-24 bg-muted/50 rounded" />
              </div>
              <div className="space-y-1.5">
                <div className="h-2 w-full bg-muted/40 rounded" />
                <div className="h-2 w-3/4 bg-muted/40 rounded" />
              </div>
              <div className="h-2 w-32 bg-muted/30 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer bar ────────────────────────────────────────────────────── */}
      <div className="border-t border-border px-4 py-3 bg-muted/5 flex items-center justify-between">
        <div className="space-y-1.5">
          <div className="h-1.5 w-8 bg-muted/40 rounded" />
          <div className="h-3 w-36 bg-muted/60 rounded" />
          <div className="h-2 w-56 bg-muted/40 rounded" />
        </div>
        <div className="h-8 w-24 rounded-md border border-border bg-muted/30 shrink-0" />
      </div>
    </div>
  );
}