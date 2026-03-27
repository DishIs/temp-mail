// components/star-rating.tsx
"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import Link from "next/link";
import { submitRating } from "@/app/actions/rating";

interface StarRatingProps {
  initialTotalStars: number;
  initialTotalCount: number;
  initialUserRating: number;
}

export function StarRating({
  initialTotalStars,
  initialTotalCount,
  initialUserRating,
}: StarRatingProps) {
  const[totalStars, setTotalStars] = useState(initialTotalStars);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [userRating, setUserRating] = useState(initialUserRating);
  const [hoveredRating, setHoveredRating] = useState(0);
  const[isSubmitting, setIsSubmitting] = useState(false);

  // Calculate averages to nearest half-star (e.g., 4.2 -> 4.0, 4.3 -> 4.5)
  const numericAverage = totalCount > 0 ? totalStars / totalCount : 0;
  const roundedAverage = Math.round(numericAverage * 2) / 2;
  const displayAverage = totalCount > 0 ? numericAverage.toFixed(1) : "0.0";

  const handleRate = async (rating: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    const oldRating = userRating;
    setUserRating(rating);

    try {
      const result = await submitRating(rating);
      setTotalStars(result.totalStars);
      setTotalCount(result.totalCount);
      setUserRating(result.userRating);
    } catch (error) {
      console.error("Failed to submit rating", error);
      setUserRating(oldRating);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-6 mb-2 gap-2">
      {/* Stars Container */}
      <div 
        className="flex items-center gap-1.5" 
        onMouseLeave={() => setHoveredRating(0)}
        role="radiogroup"
        aria-label="Rate this service"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          // If hoveredRating is 3.5, the 4th star jumps
          const isDirectlyHovered = Math.ceil(hoveredRating) === star;
          
          const isActiveInteraction = hoveredRating > 0 || userRating > 0;
          const currentActiveRating = hoveredRating > 0 ? hoveredRating : userRating > 0 ? userRating : roundedAverage;

          // Determine how much of the star to fill (0, 50, or 100)
          let fillPercent = 0;
          if (currentActiveRating >= star) fillPercent = 100;
          else if (currentActiveRating === star - 0.5) fillPercent = 50;

          // Colors based on state (Theme colors)
          const fillColorClass = isActiveInteraction 
            ? "fill-current text-foreground" 
            : "fill-muted-foreground/30 text-muted-foreground/50";
            
          const emptyColorClass = isActiveInteraction 
            ? "fill-transparent text-muted-foreground/30" 
            : "fill-transparent text-muted-foreground/20 hover:text-muted-foreground/40";

          return (
            <button
              key={star}
              type="button"
              disabled={isSubmitting}
              // Calculate exactly where they clicked (Left half vs Right half) as a fallback for touch devices
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const isHalf = (e.clientX - rect.left) < rect.width / 2;
                handleRate(isHalf ? star - 0.5 : star);
              }}
              className={`relative block w-6 h-6 p-0 outline-none transition-transform duration-200 active:scale-75 disabled:cursor-not-allowed
                ${isDirectlyHovered ? "scale-110 -translate-y-0.5" : ""}
              `}
              aria-label={`Rate ${star} stars`}
              aria-checked={userRating === star || userRating === star - 0.5}
              role="radio"
            >
              {/* Layer 1: The Empty Outline */}
              <Star
                strokeWidth={2}
                className={`absolute inset-0 w-6 h-6 transition-colors duration-300 ease-out ${emptyColorClass}`}
              />

              {/* Layer 2: The Filled Overlay (Clipped using width 50% or 100%) */}
              {fillPercent > 0 && (
                <div 
                  className="absolute inset-y-0 left-0 overflow-hidden transition-all duration-300 ease-out"
                  style={{ width: `${fillPercent}%` }}
                >
                  <Star strokeWidth={2} className={`w-6 h-6 ${fillColorClass}`} />
                </div>
              )}

              {/* Hidden hit areas to track hovering over the Left (0.5) vs Right (1.0) half */}
              <div 
                className="absolute inset-y-0 left-0 w-1/2 z-10" 
                onMouseEnter={() => setHoveredRating(star - 0.5)} 
              />
              <div 
                className="absolute inset-y-0 right-0 w-1/2 z-10" 
                onMouseEnter={() => setHoveredRating(star)} 
              />
            </button>
          );
        })}
      </div>
      
      {/* Stats & Conditional Feedback Link */}
      <div className="flex flex-wrap justify-center items-center gap-x-2 gap-y-1 text-xs text-muted-foreground font-mono">
        {totalCount > 0 ? (
          <>
            <span className="flex items-center gap-1">
              <strong className="text-foreground">{displayAverage}/5</strong>
            </span>
            <span className="text-border" aria-hidden="true">·</span>
            <span>
              Based on <strong className="text-foreground">{totalCount.toLocaleString()}</strong> reviews
            </span>
            
            {/* Feedback link appears after they vote */}
            {userRating > 0 && (
              <>
                <span className="text-border" aria-hidden="true">·</span>
                <Link
                  href="/feedback"
                  className="text-foreground/70 hover:text-foreground transition-colors underline underline-offset-2 decoration-border"
                >
                  Leave feedback →
                </Link>
              </>
            )}
          </>
        ) : (
          <span className="opacity-80">Click a star to review!</span>
        )}
      </div>
    </div>
  );
}