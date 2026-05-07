import React from "react";

export default function LoadingSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse space-y-3 w-full">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div
              key={j}
              className="h-4 bg-slate-200 rounded flex-1"
              style={{ opacity: 1 - j * 0.1 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
