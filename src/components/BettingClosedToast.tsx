"use client";

import { BettingClosedToastProps } from "@/types";

export default function BettingClosedToast({ isVisible }: BettingClosedToastProps) {
  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg"
      style={{ 
        background: 'linear-gradient(to right, rgb(255, 40, 130), rgb(55, 0, 60))'
      }}
    >
      <div className="text-center">
        <div className="text-sm sm:text-base font-semibold text-white">
          Bets closed - Gameweek in course
        </div>
      </div>
    </div>
  );
}

