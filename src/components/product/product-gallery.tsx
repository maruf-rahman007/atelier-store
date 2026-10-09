"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { Picture } from "@/lib/products";

/* Mobile: edge-to-edge swipe gallery with a position counter.
 * md and up: the first image full width, the rest two-up beneath it. */
export function ProductGallery({ images }: { images: Picture[] }) {
  const listRef = useRef<HTMLUListElement>(null);
  const [current, setCurrent] = useState(0);

  const onScroll = () => {
    const list = listRef.current;
    if (!list || list.clientWidth === 0) return;
    setCurrent(Math.round(list.scrollLeft / list.clientWidth));
  };

  return (
    <div className="relative -mx-gutter md:mx-0">
      <ul
        ref={listRef}
        onScroll={onScroll}
        aria-label="Product images"
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] md:grid md:grid-cols-2 md:gap-1 md:overflow-visible [&::-webkit-scrollbar]:hidden"
      >
        {images.map((image, index) => (
          <li
            key={image.src}
            className={`w-full shrink-0 snap-start md:w-auto ${index === 0 ? "md:col-span-2" : ""}`}
          >
            <div className="media-frame aspect-product">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : "auto"}
                sizes={
                  index === 0
                    ? "(min-width: 1024px) 64vw, (min-width: 768px) 56vw, 100vw"
                    : "(min-width: 1024px) 32vw, (min-width: 768px) 28vw, 100vw"
                }
                className="object-cover"
              />
            </div>
          </li>
        ))}
      </ul>

      <p
        aria-hidden="true"
        className="absolute bottom-4 right-gutter bg-canvas px-2 py-1 text-caption md:hidden"
      >
        {current + 1} / {images.length}
      </p>
    </div>
  );
}
