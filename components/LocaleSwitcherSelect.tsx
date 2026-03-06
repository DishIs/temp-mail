// components/LocaleSwitcherSelect.tsx
"use client";

import clsx from "clsx";
import { useParams } from "next/navigation";
import { Locale } from "next-intl";
import { ChangeEvent, ReactNode, useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";

type Props = {
  children: ReactNode;
  defaultValue: string;
  label: string;
};

export default function LocaleSwitcherSelect({ children, defaultValue, label }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const pathname = usePathname();
  const params   = useParams();

  function onSelectChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextLocale = event.target.value as Locale;
    startTransition(() => {
      router.replace(
        // @ts-expect-error
        { pathname, params },
        { locale: nextLocale }
      );
    });
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        className={clsx(
          // matches DevHeader / InfoRow style: border + bg-background, font-mono xs
          "h-8 appearance-none cursor-pointer rounded-md border border-border",
          "bg-background text-foreground text-xs font-mono",
          "pl-3 pr-7 transition-colors duration-150",
          "hover:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-border",
          isPending && "opacity-50 cursor-not-allowed pointer-events-none"
        )}
        defaultValue={defaultValue}
        disabled={isPending}
        onChange={onSelectChange}
      >
        {children}
      </select>
      {/* Chevron overlay */}
      <ChevronDown className="pointer-events-none absolute right-2 h-3 w-3 text-muted-foreground" />
    </label>
  );
}