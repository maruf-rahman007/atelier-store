/*
 * Sample catalogue loaded by `npm run db:seed`. Prices are whole US dollars
 * here and stored in cents. Gallery detail shots are focal-point crops of the
 * main Unsplash photo.
 */

import { ONE_SIZE, unsplash } from "../lib/products";
import type { ProductImage } from "./schema/catalog";

export type SeedProduct = {
  slug: string;
  name: string;
  colour: string;
  price: number; // whole US dollars
  category: string; // category slug
  description: string;
  details: string[];
  sizes: { label: string; stock: number }[];
  images: ProductImage[];
  isNew?: boolean;
};

export const seedCategories = [
  { slug: "ready-to-wear", name: "Ready-to-wear" },
  { slug: "knitwear", name: "Knitwear" },
  { slug: "shoes", name: "Shoes" },
  { slug: "bags", name: "Bags" },
  { slug: "jewellery", name: "Jewellery" },
];

/* 3:4 crop zoomed in on a focal point (x, y in 0–1) of the same photo. */
function detail(id: string, x: number, y: number, zoom: number) {
  return `https://images.unsplash.com/photo-${id}?w=1800&h=2400&fit=crop&crop=focalpoint&fp-x=${x}&fp-y=${y}&fp-z=${zoom}&q=80`;
}

const apparelSizes = (stock: [number, number, number, number, number]) =>
  ["XS", "S", "M", "L", "XL"].map((label, i) => ({ label, stock: stock[i] }));

const shoeSizes = (labels: string[], stock: number[]) =>
  labels.map((label, i) => ({ label, stock: stock[i] }));

const oneSize = (stock: number) => [{ label: ONE_SIZE, stock }];

export const seedProducts: SeedProduct[] = [
  {
    slug: "open-knit-cotton-poncho",
    name: "Open-knit cotton poncho",
    colour: "Ivory",
    price: 890,
    category: "knitwear",
    isNew: true,
    description:
      "A loose, open-stitch poncho knitted from organic cotton, finished with a hand-knotted fringe. Layer it over a fine knit or a shirt as the weather turns.",
    details: [
      "100% organic cotton",
      "Hand-knotted fringe hem",
      "Relaxed fit, hip length",
      "Hand wash cold, dry flat",
      "Made in Portugal",
    ],
    sizes: apparelSizes([3, 6, 4, 0, 2]),
    images: [
      {
        src: unsplash("1434389677669-e08b4cac3105"),
        alt: "Ivory open-knit poncho with fringed hem on a hanger",
      },
      {
        src: detail("1434389677669-e08b4cac3105", 0.5, 0.45, 2.6),
        alt: "Close-up of the open-knit cotton stitch",
      },
      {
        src: detail("1434389677669-e08b4cac3105", 0.5, 0.85, 2.4),
        alt: "Close-up of the knotted fringe hem",
      },
    ],
  },
  {
    slug: "satin-bomber-jacket",
    name: "Satin bomber jacket",
    colour: "Terracotta",
    price: 1450,
    category: "ready-to-wear",
    isNew: true,
    description:
      "A lightweight bomber in washed duchess satin with a ribbed collar, cuffs and hem. Cut close to the body with a utility pocket on the sleeve.",
    details: [
      "100% silk satin, cupro lining",
      "Two-way metal zip",
      "Sleeve pocket with zip",
      "Dry clean only",
      "Made in Italy",
    ],
    sizes: apparelSizes([2, 5, 7, 4, 1]),
    images: [
      {
        src: unsplash("1591047139829-d91aecb6caea"),
        alt: "Terracotta satin bomber jacket held up against a white wall",
      },
      {
        src: detail("1591047139829-d91aecb6caea", 0.5, 0.55, 2.6),
        alt: "Close-up of the zip and welt pocket",
      },
      {
        src: detail("1591047139829-d91aecb6caea", 0.4, 0.8, 2.4),
        alt: "Close-up of the ribbed hem and cuff",
      },
    ],
  },
  {
    slug: "brushed-cotton-sweatshirt",
    name: "Brushed cotton sweatshirt",
    colour: "White",
    price: 420,
    category: "ready-to-wear",
    isNew: true,
    description:
      "A boxy crew-neck sweatshirt in heavyweight loopback cotton, brushed on the inside for warmth. Ribbed collar, cuffs and hem hold their shape wash after wash.",
    details: [
      "100% organic cotton loopback, 480 gsm",
      "Brushed interior",
      "Relaxed, boxy fit",
      "Machine wash at 30°C",
      "Made in Portugal",
    ],
    sizes: apparelSizes([0, 2, 3, 1, 0]),
    images: [
      {
        src: unsplash("1620799140408-edc6dcb6d633"),
        alt: "White crew-neck sweatshirt laid flat",
      },
      {
        src: detail("1620799140408-edc6dcb6d633", 0.45, 0.22, 2.6),
        alt: "Close-up of the ribbed crew neck",
      },
      {
        src: detail("1620799140408-edc6dcb6d633", 0.55, 0.85, 2.4),
        alt: "Close-up of the ribbed hem",
      },
    ],
  },
  {
    slug: "pleated-jogger-trousers",
    name: "Pleated jogger trousers",
    colour: "Blush",
    price: 720,
    category: "ready-to-wear",
    description:
      "Fluid trousers in crêpe with front pleats, patch pockets and gathered cuffs. Smart enough for tailoring, easy enough for every day.",
    details: [
      "Viscose crêpe",
      "Elasticated waist and cuffs",
      "Front patch pockets",
      "Machine wash cold",
      "Made in Portugal",
    ],
    sizes: apparelSizes([4, 8, 6, 5, 3]),
    images: [
      {
        src: unsplash("1594633312681-425c7b97ccd1"),
        alt: "Blush pink pleated trousers with cuffed ankles",
      },
      {
        src: detail("1594633312681-425c7b97ccd1", 0.5, 0.18, 2.2),
        alt: "Close-up of the patch pockets and waistband",
      },
      {
        src: detail("1594633312681-425c7b97ccd1", 0.5, 0.82, 2.6),
        alt: "Close-up of the gathered ankle cuff",
      },
    ],
  },
  {
    slug: "lace-up-heeled-boots",
    name: "Lace-up heeled boots",
    colour: "Cream",
    price: 1290,
    category: "shoes",
    isNew: true,
    description:
      "Ankle boots in smooth calf leather with full-length lacing, an inside zip and a stacked block heel that's comfortable all day.",
    details: [
      "Calf leather upper and lining",
      "Leather sole with rubber insert",
      "6 cm block heel",
      "Inside zip fastening",
      "Made in Spain",
    ],
    sizes: shoeSizes(["36", "37", "38", "39", "40", "41"], [1, 3, 0, 4, 2, 0]),
    images: [
      {
        src: unsplash("1610398752800-146f269dfcc8"),
        alt: "Pair of cream leather lace-up boots with block heels",
      },
      {
        src: detail("1610398752800-146f269dfcc8", 0.38, 0.5, 2.4),
        alt: "Close-up of the lacing and eyelets",
      },
      {
        src: detail("1610398752800-146f269dfcc8", 0.5, 0.75, 2.4),
        alt: "Close-up of the stacked block heel",
      },
    ],
  },
  {
    slug: "panelled-runner-sneakers",
    name: "Panelled runner sneakers",
    colour: "Multicolour",
    price: 750,
    category: "shoes",
    description:
      "Low-profile runners built from suede, mesh and leather panels on a sculpted rubber sole. Contrast laces with a spare pair in the box.",
    details: [
      "Suede, mesh and leather upper",
      "Rubber sole",
      "Removable leather insole",
      "Spare laces included",
      "Made in Italy",
    ],
    sizes: shoeSizes(["39", "40", "41", "42", "43", "44"], [2, 5, 6, 6, 3, 1]),
    images: [
      {
        src: unsplash("1560769629-975ec94e6a86"),
        alt: "Pair of pastel panelled running sneakers on a white plinth",
      },
      {
        src: detail("1560769629-975ec94e6a86", 0.4, 0.35, 2.4),
        alt: "Close-up of the suede and mesh panels",
      },
      {
        src: detail("1560769629-975ec94e6a86", 0.55, 0.75, 2.4),
        alt: "Close-up of the sculpted rubber sole",
      },
    ],
  },
  {
    slug: "polka-dot-cotton-shirt",
    name: "Polka-dot cotton shirt",
    colour: "Denim blue",
    price: 640,
    category: "ready-to-wear",
    description:
      "A relaxed shirt in soft cotton poplin printed with a tiny polka dot. Point collar, mother-of-pearl buttons and a curved hem to wear in or out.",
    details: [
      "100% cotton poplin",
      "Mother-of-pearl buttons",
      "Relaxed fit",
      "Machine wash at 30°C",
      "Made in Portugal",
    ],
    sizes: apparelSizes([2, 4, 5, 3, 2]),
    images: [
      {
        src: unsplash("1596755094514-f87e34085b2c"),
        alt: "Blue polka-dot cotton shirt on a hanger",
      },
      {
        src: detail("1596755094514-f87e34085b2c", 0.5, 0.55, 2.6),
        alt: "Close-up of the button placket",
      },
      {
        src: detail("1596755094514-f87e34085b2c", 0.66, 0.7, 3),
        alt: "Close-up of the polka-dot print",
      },
    ],
  },
  {
    slug: "glass-heart-earrings",
    name: "Glass heart earrings",
    colour: "Cobalt and gold",
    price: 460,
    category: "jewellery",
    isNew: true,
    description:
      "Hand-blown cobalt glass hearts on fine gold-plated hooks. Each pair is made individually, so the colour varies slightly from piece to piece.",
    details: [
      "Murano glass",
      "18k gold-plated sterling silver hooks",
      "Drop length 3 cm",
      "Store in the pouch provided",
      "Made in Italy",
    ],
    sizes: oneSize(0),
    images: [
      {
        src: unsplash("1630019852942-f89202989a59"),
        alt: "Pair of gold hook earrings with cobalt glass hearts",
      },
      {
        src: detail("1630019852942-f89202989a59", 0.4, 0.5, 2.2),
        alt: "Close-up of a cobalt glass heart",
      },
      {
        src: detail("1630019852942-f89202989a59", 0.62, 0.45, 2.2),
        alt: "Close-up of the gold-plated hook",
      },
    ],
  },
  {
    slug: "buckled-leather-satchel",
    name: "Buckled leather satchel",
    colour: "Dove grey",
    price: 1890,
    category: "bags",
    isNew: true,
    description:
      "A compact satchel in pebbled leather with twin buckle straps, a top handle and an adjustable cross-body strap.",
    details: [
      "Pebbled calf leather, cotton lining",
      "Brass buckles",
      "Adjustable cross-body strap",
      "W 28 × H 21 × D 9 cm",
      "Made in Spain",
    ],
    sizes: oneSize(6),
    images: [
      {
        src: unsplash("1605733513597-a8f8341084e6"),
        alt: "Grey leather satchel with two buckled straps",
      },
      {
        src: detail("1605733513597-a8f8341084e6", 0.62, 0.6, 2.6),
        alt: "Close-up of a brass buckle",
      },
      {
        src: detail("1605733513597-a8f8341084e6", 0.5, 0.3, 2.4),
        alt: "Close-up of the top handle and pebbled leather",
      },
    ],
  },
  {
    slug: "chevron-chain-shoulder-bag",
    name: "Chevron chain shoulder bag",
    colour: "Rose",
    price: 2100,
    category: "bags",
    description:
      "A slim flap bag in smooth leather with an inlaid chevron stripe, hung from a fine chain that doubles up for shoulder carry.",
    details: [
      "Smooth calf leather with leather inlay",
      "Magnetic flap closure",
      "Chain strap, 110 cm",
      "W 22 × H 14 × D 6 cm",
      "Made in Italy",
    ],
    sizes: oneSize(5),
    images: [
      {
        src: unsplash("1566150905458-1bf1fc113f0d"),
        alt: "Pink shoulder bag with chevron stripe and chain strap",
      },
      {
        src: detail("1566150905458-1bf1fc113f0d", 0.45, 0.45, 2.6),
        alt: "Close-up of the inlaid chevron stripe",
      },
      {
        src: detail("1566150905458-1bf1fc113f0d", 0.75, 0.62, 2.6),
        alt: "Close-up of the chain strap",
      },
    ],
  },
  {
    slug: "leather-backpack",
    name: "Leather backpack",
    colour: "Rosewood",
    price: 1650,
    category: "bags",
    description:
      "A soft backpack in waxed leather with a zipped front pocket and padded straps. Fits a 14-inch laptop.",
    details: [
      "Waxed calf leather, canvas lining",
      "Padded laptop sleeve",
      "Adjustable shoulder straps",
      "W 30 × H 40 × D 14 cm",
      "Made in Spain",
    ],
    sizes: oneSize(9),
    images: [
      {
        src: unsplash("1622560480605-d83c853bc5c3"),
        alt: "Rosewood leather backpack with front pocket",
      },
      {
        src: detail("1622560480605-d83c853bc5c3", 0.5, 0.65, 2.4),
        alt: "Close-up of the zipped front pocket",
      },
      {
        src: detail("1622560480605-d83c853bc5c3", 0.5, 0.38, 2.4),
        alt: "Close-up of the top handle and waxed leather",
      },
    ],
  },
];
