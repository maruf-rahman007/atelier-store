"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import { ProductCard } from "@/components/product-card";
import type { NavItem } from "@/lib/catalog";
import type { Product } from "@/lib/products";

/* Horizontal product carousel with its heading row: native scroll/swipe,
 * plus previous and next buttons for pointer users from md up. */
export function ProductRail({
  id,
  title,
  link,
  products,
}: {
  id: string;
  title: string;
  link: NavItem;
  products: Product[];
}) {
  const railRef = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const update = () => {
      setEdges({
        start: rail.scrollLeft <= 1,
        end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 1,
      });
    };

    update();
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      rail.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scroll = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)")
      .matches;
    rail.scrollBy({
      left: direction * rail.clientWidth * 0.75,
      behavior: smooth ? "smooth" : "auto",
    });
  };

  return (
    <div className="mx-auto max-w-page">
      <div className="flex items-baseline justify-between gap-6 px-gutter">
        <h2 id={id} className="text-title">
          {title}
        </h2>
        <div className="flex items-center gap-5">
          <Link href={link.href} className="link text-small">
            {link.label}
          </Link>
          <div className="hidden md:flex">
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              aria-label="Previous products"
              onClick={() => scroll(-1)}
              disabled={edges.start}
            >
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-icon -mr-3"
              aria-label="Next products"
              onClick={() => scroll(1)}
              disabled={edges.end}
            >
              <ChevronRightIcon />
            </button>
          </div>
        </div>
      </div>

      <ul ref={railRef} className="rail mt-6" aria-labelledby={id}>
        {products.map((product) => (
          <li key={product.slug}>
            <ProductCard
              product={product}
              sizes="(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 70vw"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
