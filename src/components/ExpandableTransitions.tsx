"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableTransitionsProps {
  children: React.ReactNode;
  initialShow?: number;
  title?: string;
}

export default function ExpandableTransitions({
  children,
  initialShow = 5,
  title,
}: ExpandableTransitionsProps) {
  const [expanded, setExpanded] = useState(false);
  const allChildren = Array.isArray(children) ? children : [children];
  const totalCount = allChildren.filter(Boolean).length;
  const hasMore = totalCount > initialShow;
  const visible = expanded ? allChildren : allChildren.slice(0, initialShow);

  return (
    <section className="space-y-3">
      {title && (
        <h2 className="text-sm font-semibold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
          {title}
        </h2>
      )}
      <div className="space-y-2">
        {visible}
      </div>
      {hasMore && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 transition-colors dark:text-amber-400 dark:hover:text-amber-300"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {totalCount - initialShow} more
            </>
          )}
        </button>
      )}
    </section>
  );
}
