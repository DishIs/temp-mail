"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Sparkles, Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnnouncementBannerProps {
  emailArrived?: boolean;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  link?: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
  dismissTime: number;
  delayBeforeShowing: number;
  showAfter1stEmailArrives: boolean;
}

const POSITION_CLASSES = {
  "top-right": "top-16 right-4 md:top-20",
  "top-left": "top-16 left-4 md:top-20",
  "bottom-right": "bottom-4 right-4",
  "bottom-left": "bottom-4 left-4",
};

export function AnnouncementBanner({ emailArrived = false }: AnnouncementBannerProps) {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasTrackedView, setHasTrackedView] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingTimeRef = useRef<number>(0);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-100, 0, 100], [0, 1, 0]);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const res = await fetch("/api/announcement");
        const data = await res.json();
        
        if (data.show && data.announcement) {
          if (data.announcement.showAfter1stEmailArrives && !emailArrived) {
            setIsLoading(false);
            return;
          }
          setAnnouncement(data.announcement);
        }
      } catch (error) {
        console.error("Failed to fetch announcement:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnnouncement();
  }, [emailArrived]);

  const trackAction = useCallback(async (action: "view" | "click" | "dismiss") => {
    if (!announcement) return;
    
    try {
      await fetch("/api/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, announcementId: announcement.id }),
      });
    } catch (error) {
      console.error("Failed to track announcement action:", error);
    }
  }, [announcement]);

  const dismissAnnouncement = useCallback(() => {
    if (isExiting) return;
    setIsExiting(true);
    trackAction("dismiss");
    setIsDismissed(true);
    
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    remainingTimeRef.current = 0;
  }, [isExiting, trackAction]);

  const handleClick = useCallback(() => {
    if (!announcement) return;
    trackAction("click");
    if (announcement.link) {
      window.open(announcement.link, "_blank", "noopener,noreferrer");
    }
    dismissAnnouncement();
  }, [announcement, trackAction, dismissAnnouncement]);

  const startDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
    }
    if (announcement && announcement.dismissTime > 0) {
      remainingTimeRef.current = announcement.dismissTime;
      dismissTimerRef.current = setTimeout(() => {
        dismissAnnouncement();
      }, remainingTimeRef.current);
    }
  }, [announcement, dismissAnnouncement]);

  const pauseDismissTimer = useCallback(() => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const resumeDismissTimer = useCallback(() => {
    if (remainingTimeRef.current > 0 && announcement && !isExiting) {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = setTimeout(() => {
        dismissAnnouncement();
      }, remainingTimeRef.current);
    }
  }, [announcement, isExiting, dismissAnnouncement]);

  useEffect(() => {
    if (!announcement || isLoading || isDismissed || isExiting || isVisible) return;

    const showTimer = setTimeout(() => {
      if (!isDismissed) {
        setIsVisible(true);
        
        if (!hasTrackedView) {
          trackAction("view");
          setHasTrackedView(true);
        }

        startDismissTimer();
      }
    }, announcement.delayBeforeShowing);

    return () => clearTimeout(showTimer);
  }, [announcement, isLoading, isDismissed, isExiting, isVisible, trackAction, dismissAnnouncement, hasTrackedView, startDismissTimer]);

  useEffect(() => {
    if (isHovered) {
      pauseDismissTimer();
    } else if (isVisible) {
      resumeDismissTimer();
    }
  }, [isHovered, isVisible, pauseDismissTimer, resumeDismissTimer]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const handleDragEnd = useCallback((_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const threshold = 80;
    if (Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > 400) {
      dismissAnnouncement();
    }
  }, [dismissAnnouncement]);

  if (isLoading || !announcement || isDismissed) {
    return null;
  }

  const accentColor = announcement.accentColor || "#f59e0b";

  return (
    <AnimatePresence>
      {isVisible && !isExiting && (
        <motion.div
          initial={{ opacity: 0, y: -10, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -10, x: 100, transition: { duration: 0.15 } }}
          style={{ x, opacity }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.5}
          onDragEnd={handleDragEnd}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setIsHovered(false)}
          className={cn(
            "fixed z-40 cursor-pointer",
            POSITION_CLASSES[announcement.position]
          )}
          onClick={handleClick}
        >
          <div
            className={cn(
              "group relative flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60",
              "bg-background/95 backdrop-blur-sm shadow-[0_2px_12px_rgba(0,0,0,0.15)] dark:shadow-[0_2px_20px_rgba(0,0,0,0.5)]",
              "max-w-[280px] md:max-w-sm hover:scale-[1.02] hover:shadow-[0_4px_20px_rgba(0,0,0,0.2)]",
              "transition-all duration-200 cursor-pointer"
            )}
          >
            <div 
              className="shrink-0 w-6 h-6 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <Bitcoin className="w-3.5 h-3.5" style={{ color: accentColor }} />
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate leading-tight">
                {announcement.title}
              </p>
              {announcement.message && (
                <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-relaxed">
                  {announcement.message}
                </p>
              )}
            </div>

            {announcement.link && (
              <ExternalLink className="w-3 h-3 text-muted-foreground/50 shrink-0 group-hover:text-foreground transition-colors" />
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                dismissAnnouncement();
              }}
              className="absolute -top-1.5 -right-1.5 p-1 rounded-full bg-background border border-border/50 shadow-sm hover:bg-muted transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-2.5 h-2.5 text-muted-foreground" />
            </button>

            <div 
              className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full opacity-60"
              style={{ 
                background: `linear-gradient(to right, ${accentColor}, ${accentColor}80, transparent)` 
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}