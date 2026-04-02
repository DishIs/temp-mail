"use client";

import { useEffect, useState, useRef } from "react";
import { animate, motion, useInView } from "framer-motion";

function AnimatedNumber({ value }: { value: number }) {
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    const controls = animate(currentValue, value, {
      duration: 2,
      onUpdate(latest) {
        setCurrentValue(Math.round(latest));
      }
    });
    return () => controls.stop();
  }, [currentValue, value]);

  return <span>{currentValue.toLocaleString()}</span>;
}

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

export function ApiStats() {
  return (
    <section className="relative border-t border-border px-6 py-12 md:py-16">
      <div className="absolute inset-0 pointer-events-none grid grid-cols-2 sm:grid-cols-4 w-full h-full max-w-7xl mx-auto divide-x divide-border opacity-[0.03]">
        <div /><div /><div /><div />
      </div>
      <div className="relative z-10 max-w-5xl w-full mx-auto">
        <FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight"><AnimatedNumber value={15000000} />+</p>
              <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-widest">API Calls / Day</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight"><AnimatedNumber value={2500000} />+</p>
              <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-widest">Emails / Day</p>
            </div>
            <div className="text-center">
              <p className="text-4xl md:text-5xl font-bold text-foreground tracking-tight"><AnimatedNumber value={5000} />+</p>
              <p className="text-sm text-muted-foreground mt-2 font-medium uppercase tracking-widest">Developers</p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
