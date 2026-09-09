"use client";

import { useState } from "react";

// A rough length heuristic rather than measuring rendered lines: measuring
// would need a client-only effect (a hydration mismatch waiting to happen,
// since the server can't know the viewport width) just to decide whether a
// button should exist at all. A description this short essentially never
// needs truncating in practice, so the two disagreeing only risks showing
// an unnecessary "Read more" on an edge case, never hiding real text.
const TRUNCATE_THRESHOLD_CHARS = 320;

/**
 * Long-form text (the listing description) collapsed to a few lines with a
 * "Read more" toggle - never applied to text short enough that collapsing
 * it would just add a pointless button under otherwise-fully-visible text.
 */
export function ReadMoreText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > TRUNCATE_THRESHOLD_CHARS;

  return (
    <div>
      <p className={expanded || !isLong ? className : `line-clamp-5 ${className ?? ""}`}>{text}</p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="focus-ring mt-2 rounded text-sm font-semibold text-brand-700 underline-offset-2 hover:text-brand-800 hover:underline"
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
