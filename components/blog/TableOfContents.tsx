'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface Heading {
    id: string;
    text: string;
    level: number;
}

interface TableOfContentsProps {
    headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
    const [activeId, setActiveId] = useState<string>('');

    useEffect(() => {
        if (headings.length === 0) return;

        const observer = new IntersectionObserver(
            (entries) => {
                // Find the topmost visible heading
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    setActiveId(visible[0].target.id);
                }
            },
            {
                rootMargin: '-80px 0px -60% 0px',
                threshold: 0,
            }
        );

        headings.forEach(({ id }) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, [headings]);

    if (headings.length < 2) return null;

    return (
        <nav aria-label="Table of contents" className="toc-nav">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                On this page
            </p>
            <ul className="space-y-1">
                {headings.map(({ id, text, level }) => (
                    <li key={id} style={{ paddingLeft: level === 3 ? '0.75rem' : '0' }}>
                        <a
                            href={`#${id}`}
                            onClick={(e) => {
                                e.preventDefault();
                                const el = document.getElementById(id);
                                if (el) {
                                    const top = el.getBoundingClientRect().top + window.scrollY - 88;
                                    window.scrollTo({ top, behavior: 'smooth' });
                                    setActiveId(id);
                                }
                            }}
                            className={cn(
                                'block text-sm leading-snug py-0.5 border-l-2 pl-3 transition-all duration-150',
                                activeId === id
                                    ? 'border-primary text-foreground font-medium'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
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