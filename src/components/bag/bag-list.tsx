"use client";

import { useEffect, useRef, useState } from "react";
import { lineKey, type BagLine as BagLineData } from "@/lib/bag";
import { BagLine } from "./bag-line";

/*
 * The bag's lines. When a line is removed it unmounts along with the button
 * that had focus, so focus moves to the list heading and the removal is
 * announced instead of being lost.
 */
export function BagList({ lines }: { lines: BagLineData[] }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const previous = useRef(lines);
  const [announcement, setAnnouncement] = useState("");

  useEffect(() => {
    const current = new Set(lines.map((l) => lineKey(l.slug, l.size)));
    const removed = previous.current.filter(
      (l) => !current.has(lineKey(l.slug, l.size)),
    );
    previous.current = lines;
    if (removed.length === 0) return;

    setAnnouncement(
      removed.length === 1
        ? `${removed[0].name} removed from your bag.`
        : `${removed.length} pieces removed from your bag.`,
    );
    const active = document.activeElement;
    if (!active || active === document.body) headingRef.current?.focus();
  }, [lines]);

  return (
    <div>
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        Items in your bag
      </h2>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <ul className="border-t">
        {lines.map((line) => (
          <BagLine key={lineKey(line.slug, line.size)} line={line} />
        ))}
      </ul>
    </div>
  );
}
