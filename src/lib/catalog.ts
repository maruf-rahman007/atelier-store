/*
 * Sample storefront content (navigation, homepage sections) until it lives in
 * a CMS. Product rails list slugs; the products themselves come from the
 * database.
 */

import { unsplash, type Picture } from "@/lib/products";

export type Collection = {
  slug: string;
  title: string;
  description?: string;
  image: Picture;
};

export type NavItem = {
  label: string;
  href: string;
};

export const primaryNav: NavItem[] = [
  { label: "Women", href: "/collections/women" },
  { label: "Men", href: "/collections/men" },
  { label: "Bags", href: "/collections/bags" },
  { label: "Shoes", href: "/collections/shoes" },
  { label: "Jewellery", href: "/collections/jewellery" },
];

export const hero = {
  title: "Autumn–Winter 2026",
  description:
    "Long wool coats, soft tailoring and leather made to be worn for years.",
  images: [
    {
      src: unsplash("1539109136881-3be0616acf4b"),
      alt: "Woman in a pale blue wool coat on a city square",
    },
    {
      src: unsplash("1552374196-1ab2a1c593e8"),
      alt: "Man in a camel blazer seated on a wooden stool",
    },
  ] satisfies Picture[],
  action: {
    label: "Shop the collection",
    href: "/collections/autumn-winter-2026",
  } satisfies NavItem,
};

export const newArrivalSlugs = [
  "open-knit-cotton-poncho",
  "satin-bomber-jacket",
  "brushed-cotton-sweatshirt",
  "pleated-jogger-trousers",
  "lace-up-heeled-boots",
  "panelled-runner-sneakers",
  "polka-dot-cotton-shirt",
];

export const featuredCollections: Collection[] = [
  {
    slug: "women",
    title: "Women",
    description: "Coats, knitwear and tailoring for the colder months.",
    image: {
      src: unsplash("1485968579580-b6d095142e6e"),
      alt: "Woman in a checked wool coat walking down a street",
    },
  },
  {
    slug: "men",
    title: "Men",
    description: "Sharp suiting and easy layers in deep blues and browns.",
    image: {
      src: unsplash("1617137968427-85924c800a22"),
      alt: "Man in a navy suit walking past a glass building",
    },
  },
];

export const spotlight = {
  title: "The accessories edit",
  description:
    "Satchels and shoulder bags in calf leather, and glass jewellery made by hand.",
  href: "/collections/accessories",
  actionLabel: "Shop accessories",
  image: {
    src: unsplash("1483985988355-763728e1935b"),
    alt: "Woman in a burgundy coat carrying shopping bags",
  },
  productSlugs: [
    "buckled-leather-satchel",
    "chevron-chain-shoulder-bag",
    "leather-backpack",
    "glass-heart-earrings",
  ],
};

export const story = {
  title: "Made in small runs",
  body: [
    "Every piece starts in our workshop, where patterns are cut by hand and each collection is produced in limited numbers.",
    "Fewer pieces means more time on the details: hand-finished seams, natural fibres and leather that improves with wear.",
  ],
  href: "/about",
  linkLabel: "Visit the workshop",
  images: [
    {
      src: unsplash("1445205170230-053b83016050"),
      alt: "Rail of neutral-toned garments in a warmly lit shop",
    },
    {
      src: unsplash("1556905055-8f358a7a47b2"),
      alt: "Knitwear, denim and a beanie laid out with tulips",
    },
  ] satisfies Picture[],
};

export const categories: Collection[] = [
  {
    slug: "ready-to-wear",
    title: "Ready-to-wear",
    image: {
      src: unsplash("1490481651871-ab68de25d43d"),
      alt: "Neutral blouses and knits on a wall-mounted rail",
    },
  },
  {
    slug: "knitwear",
    title: "Knitwear",
    image: {
      src: unsplash("1558769132-cb1aea458c5e"),
      alt: "Cream and beige sweaters hanging beside dried pampas grass",
    },
  },
  {
    slug: "shoes",
    title: "Shoes",
    image: {
      src: unsplash("1614252235316-8c857d38b5f4"),
      alt: "Close-up of polished brown leather shoes",
    },
  },
  {
    slug: "jewellery",
    title: "Jewellery",
    image: {
      src: unsplash("1515562141207-7a88fb7ce338"),
      alt: "Pearl necklace in an open jewellery box",
    },
  },
];

export const services = [
  {
    title: "Free alterations",
    body: "Hems and sleeves adjusted on any tailoring at no extra cost.",
  },
  {
    title: "Book an appointment",
    body: "Try pieces in store with a stylist, in person or by video call.",
  },
  {
    title: "Gift wrapping",
    body: "Every order arrives in our signature box with a handwritten note.",
  },
  {
    title: "Repairs for life",
    body: "Send leather goods back to the workshop for cleaning and repair.",
  },
];

export const footerNav: { title: string; links: NavItem[] }[] = [
  {
    title: "Client services",
    links: [
      { label: "Contact us", href: "/help/contact" },
      { label: "Delivery", href: "/help/delivery" },
      { label: "Returns", href: "/help/returns" },
      { label: "Repairs", href: "/help/repairs" },
      { label: "FAQ", href: "/help" },
    ],
  },
  {
    title: "The company",
    links: [
      { label: "About Atelier", href: "/about" },
      { label: "Stores", href: "/stores" },
      { label: "Careers", href: "/careers" },
      { label: "Sustainability", href: "/sustainability" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "/legal/privacy" },
      { label: "Terms of sale", href: "/legal/terms" },
      { label: "Accessibility", href: "/legal/accessibility" },
    ],
  },
];
