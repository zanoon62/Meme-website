import type { Product, ProductSize } from "@/components/providers/ui-provider";
import { img, editorialImg } from "@/lib/img";

// ============ MEME Women's Atelier Catalog (Egypt / EGP) ============
// All prices in Egyptian Pound (ج.م). All imagery is locally generated.
// Each product is original to the MEME women's identity.

export const CURRENCY = "EGP";

export const products: Product[] = [
  {
    id: "w-001",
    slug: "noir-tailored-blazer-dress",
    name: "Noir Tailored Blazer Dress",
    subtitle: "Single-button blazer dress in Italian wool",
    description:
      "A sharply tailored blazer dress cut from Italian virgin wool with a suppressed waist and structured shoulder. The Noir features a clean single-button front, peak lapels, and a hem that lands mid-thigh for an elongating silhouette. Fully canvassed interior with bemberg lining. Wear it solo with heels for evening, or layered over wide-leg trousers for a modern suiting moment. Designed in our Cairo atelier and tailored to order.",
    price: 14500,
    compareAtPrice: 18500,
    currency: "EGP",
    category: "Tailoring",
    collection: "Atelier Noir",
    colors: [
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Bone", hex: "#e3dac9" },
      { name: "Camel", hex: "#c19a6b" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      img("Noir Blazer Dress", "Tailoring", "noir", 0),
      img("Noir Blazer Dress", "Tailoring", "bone", 1),
      img("Noir Blazer Dress", "Tailoring", "camel", 2),
    ],
    badges: ["Best Seller", "Premium Wool"],
    rating: 4.9,
    reviewCount: 327,
    inventory: 24,
    material: "100% Italian Virgin Wool",
    care: "Dry clean only. Steam to refresh.",
    isBestSeller: true,
    isTrending: true,
    tags: ["blazer", "dress", "tailored", "wool", "womens"],
  },
  {
    id: "w-002",
    slug: "cashmere-oversized-hoodie",
    name: "Cashmere Oversized Hoodie",
    subtitle: "Brushed cashmere blend hoodie in boxy fit",
    description:
      "Our signature oversized hoodie reimagined in a cashmere-cotton blend. The Cashmere Hoodie features a boxy silhouette, dropped shoulders, double-layer hood, and a kangaroo pocket engineered to hold its shape. Garment-dyed for depth of color and a lived-in hand feel from day one. Tonal embroidered MEME crest at the chest. The effortless layer for off-duty days in the city.",
    price: 7800,
    currency: "EGP",
    category: "Hoodies & Sweatshirts",
    collection: "Core Essentials",
    colors: [
      { name: "Bone", hex: "#e3dac9" },
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Sage", hex: "#9caf88" },
      { name: "Dusty Rose", hex: "#c8a0a0" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      img("Cashmere Hoodie", "Hoodies & Sweatshirts", "bone", 0),
      img("Cashmere Hoodie", "Hoodies & Sweatshirts", "noir", 1),
      img("Cashmere Hoodie", "Hoodies & Sweatshirts", "sage", 2),
    ],
    badges: ["New", "Cashmere Blend"],
    rating: 4.8,
    reviewCount: 512,
    inventory: 86,
    material: "70% Cotton, 30% Mongolian Cashmere",
    care: "Machine wash cold inside out, dry flat.",
    isNew: true,
    isTrending: true,
    tags: ["hoodie", "oversized", "cashmere", "casual", "womens"],
  },
  {
    id: "w-003",
    slug: "wide-leg-silk-trouser",
    name: "Wide-Leg Silk Trouser",
    subtitle: "High-rise pleated trouser in silk-wool",
    description:
      "A high-rise, double-pleated wide-leg trouser cut from a silk-wool blend that drapes like water. The Wide-Leg features a clean fall from hip to hem, side pockets, and a single back welt pocket. Lightweight, breathable, and structured — the year-round trouser that moves with you. Pair with the Noir Blazer Dress for a full suiting moment, or a silk camisole for evening.",
    price: 8900,
    compareAtPrice: 11000,
    currency: "EGP",
    category: "Pants",
    collection: "Atelier Noir",
    colors: [
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Stone", hex: "#8a8a7a" },
      { name: "Bone", hex: "#e3dac9" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      img("Wide-Leg Trouser", "Pants", "noir", 0),
      img("Wide-Leg Trouser", "Pants", "stone", 1),
      img("Wide-Leg Trouser", "Pants", "bone", 2),
    ],
    badges: ["Best Seller"],
    rating: 4.7,
    reviewCount: 198,
    inventory: 42,
    material: "55% Silk, 45% Wool",
    care: "Dry clean recommended.",
    isBestSeller: true,
    tags: ["trouser", "tailored", "silk", "wide-leg", "womens"],
  },
  {
    id: "w-004",
    slug: "atelier-camel-overcoat",
    name: "Atelier Camel Overcoat",
    subtitle: "Double-breasted long overcoat in merino wool",
    description:
      "A floor-grazing double-breasted overcoat tailored from 100% Italian merino wool. The Atelier features peak lapels, a clean shoulder, and a welted pocket configuration that reads quiet luxury. Half-canvas construction ensures the coat breaks beautifully across the chest. The quintessential winter statement piece, designed to layer over everything from tailoring to knitwear — made for Cairo winters and Alexandrian evenings by the sea.",
    price: 26500,
    compareAtPrice: 32000,
    currency: "EGP",
    category: "Outerwear",
    collection: "Atelier Noir",
    colors: [
      { name: "Camel", hex: "#c19a6b" },
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Stone", hex: "#8a8a7a" },
    ],
    sizes: ["XS", "S", "M", "L"],
    images: [
      img("Camel Overcoat", "Outerwear", "camel", 0),
      img("Camel Overcoat", "Outerwear", "noir", 1),
      img("Camel Overcoat", "Outerwear", "stone", 2),
    ],
    badges: ["Premium", "Limited"],
    rating: 5.0,
    reviewCount: 89,
    inventory: 12,
    material: "100% Italian Merino Wool",
    care: "Dry clean only. Store on a wide hanger.",
    isLimited: true,
    isBestSeller: true,
    tags: ["coat", "outerwear", "wool", "winter", "womens"],
  },
  {
    id: "w-005",
    slug: "silk-slip-dress",
    name: "Bias-Cut Silk Slip Dress",
    subtitle: "Floor-skimming slip in mulberry silk",
    description:
      "A bias-cut floor-skimming slip dress cut from 19-momme mulberry silk. The Slip features a cowl neckline, delicate adjustable straps, and a body-skimming silhouette that drapes over every curve. Lightweight enough to layer under a blazer, elegant enough to wear solo. A modern heirloom designed for every occasion — from Cairo Opera openings to Nile-side dinners.",
    price: 11500,
    currency: "EGP",
    category: "Dresses",
    collection: "Atelier Noir",
    colors: [
      { name: "Champagne", hex: "#f7e7c4" },
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Burgundy", hex: "#5e1f2d" },
      { name: "Sage", hex: "#9caf88" },
    ],
    sizes: ["XS", "S", "M", "L"],
    images: [
      img("Silk Slip Dress", "Dresses", "champagne", 0),
      img("Silk Slip Dress", "Dresses", "noir", 1),
      img("Silk Slip Dress", "Dresses", "burgundy", 2),
    ],
    badges: ["Best Seller", "100% Silk"],
    rating: 4.9,
    reviewCount: 412,
    inventory: 56,
    material: "100% Mulberry Silk (19mm)",
    care: "Hand wash cold or dry clean. Hang dry.",
    isBestSeller: true,
    isTrending: true,
    tags: ["dress", "slip", "silk", "evening", "womens"],
  },
  {
    id: "w-006",
    slug: "merino-crewneck-sweater",
    name: "Fine Merino Crewneck Sweater",
    subtitle: "Fine-gauge crewneck in extra-fine merino",
    description:
      "A fine-gauge crewneck sweater knit from 19.5-micron extra-fine merino wool. The Merino Crew features a clean ribbed collar, fitted cuff, and a body that skims without clinging. Lightweight enough to layer, warm enough to wear alone. Naturally temperature-regulating, moisture-wicking, and odor-resistant — the smart knit for every season, perfect for Cairo's mild winters.",
    price: 6200,
    compareAtPrice: 7500,
    currency: "EGP",
    category: "Knitwear",
    collection: "Core Essentials",
    colors: [
      { name: "Bone", hex: "#e3dac9" },
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Camel", hex: "#c19a6b" },
      { name: "Dusty Rose", hex: "#c8a0a0" },
      { name: "Slate", hex: "#708090" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      img("Merino Crewneck", "Knitwear", "bone", 0),
      img("Merino Crewneck", "Knitwear", "camel", 1),
      img("Merino Crewneck", "Knitwear", "slate", 2),
    ],
    badges: ["Premium"],
    rating: 4.8,
    reviewCount: 312,
    inventory: 67,
    material: "100% Extra-Fine Merino Wool (19.5 micron)",
    care: "Hand wash cold or dry clean. Reshape and dry flat.",
    isTrending: true,
    tags: ["sweater", "knit", "merino", "layering", "womens"],
  },
  {
    id: "w-007",
    slug: "leather-moto-jacket",
    name: "Cropped Leather Moto Jacket",
    subtitle: "Cropped biker in Italian lambskin",
    description:
      "A cropped moto jacket cut from butter-soft Italian lambskin. The Moto features an asymmetric zip front, snap-lapel collar, and quilted shoulder panels that break in beautifully. Silver-tone hardware, viscose lining, and four pockets engineered for daily carry. A heritage piece designed to outlive every trend — pair with the silk slip dress for high-low contrast.",
    price: 38500,
    currency: "EGP",
    category: "Outerwear",
    collection: "Atelier Noir",
    colors: [
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Cognac", hex: "#9a3833" },
      { name: "Bone", hex: "#e3dac9" },
    ],
    sizes: ["XS", "S", "M", "L"],
    images: [
      img("Leather Moto Jacket", "Outerwear", "noir", 0),
      img("Leather Moto Jacket", "Outerwear", "cognac", 1),
      img("Leather Moto Jacket", "Outerwear", "bone", 2),
    ],
    badges: ["Limited", "Premium Leather"],
    rating: 4.9,
    reviewCount: 76,
    inventory: 8,
    material: "100% Italian Lambskin Leather, Viscose Lining",
    care: "Professional leather clean only.",
    isLimited: true,
    tags: ["jacket", "leather", "moto", "outerwear", "womens"],
  },
  {
    id: "w-008",
    slug: "midi-pencil-skirt",
    name: "Tailored Midi Pencil Skirt",
    subtitle: "High-waist pencil skirt in tropical wool",
    description:
      "A high-waisted midi pencil skirt cut from Italian tropical wool. The Pencil features a clean fall from waist to knee, a back vent for movement, and a hidden back zip. Polished, professional, and endlessly versatile — pair with the Merino Crewneck for the office, or a silk camisole for evening. The foundation piece of a modern wardrobe.",
    price: 7400,
    currency: "EGP",
    category: "Skirts",
    collection: "Atelier Noir",
    colors: [
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Stone", hex: "#8a8a7a" },
      { name: "Camel", hex: "#c19a6b" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      img("Midi Pencil Skirt", "Skirts", "noir", 0),
      img("Midi Pencil Skirt", "Skirts", "stone", 1),
      img("Midi Pencil Skirt", "Skirts", "camel", 2),
    ],
    badges: ["New"],
    rating: 4.7,
    reviewCount: 142,
    inventory: 53,
    material: "100% Italian Tropical Wool",
    care: "Dry clean recommended.",
    isNew: true,
    tags: ["skirt", "pencil", "tailored", "wool", "womens"],
  },
  {
    id: "w-009",
    slug: "cashmere-wrap-scarf",
    name: "Cashmere Wrap Scarf",
    subtitle: "Oversized scarf in Mongolian cashmere",
    description:
      "An oversized 200cm scarf woven from grade-A Mongolian cashmere. The Wrap features hand-knotted fringe, a generous width that doubles as a shawl, and a weightless warmth that feels like wearing a cloud. Naturally dyed in muted tones that complement every palette. A lifetime companion piece that elevates every coat in your closet.",
    price: 7800,
    currency: "EGP",
    category: "Accessories",
    collection: "Atelier Noir",
    colors: [
      { name: "Camel", hex: "#c19a6b" },
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Bone", hex: "#e3dac9" },
      { name: "Dusty Rose", hex: "#c8a0a0" },
    ],
    sizes: ["ONE SIZE"],
    images: [
      img("Cashmere Wrap Scarf", "Accessories", "camel", 0),
      img("Cashmere Wrap Scarf", "Accessories", "noir", 1),
      img("Cashmere Wrap Scarf", "Accessories", "dusty rose", 2),
    ],
    badges: ["Premium", "Cashmere"],
    rating: 4.9,
    reviewCount: 187,
    inventory: 34,
    material: "100% Grade-A Mongolian Cashmere",
    care: "Dry clean or hand wash cold. Dry flat.",
    isTrending: true,
    tags: ["scarf", "accessory", "cashmere", "winter", "womens"],
  },
  {
    id: "w-010",
    slug: "leather-shoulder-tote",
    name: "Structured Leather Shoulder Tote",
    subtitle: "Structured tote in full-grain Italian leather",
    description:
      "A structured everyday tote crafted from full-grain Italian leather with a magnetic snap closure, interior zip pocket, and laptop sleeve (fits 14\"). The Tote features tonal stitched MEME monogram, gold-tone hardware, and a base that holds its shape. Rugged enough for daily use, refined enough for the office. Develops a beautiful patina with age.",
    price: 14500,
    compareAtPrice: 17500,
    currency: "EGP",
    category: "Accessories",
    collection: "Core Essentials",
    colors: [
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Cognac", hex: "#9a3833" },
      { name: "Bone", hex: "#e3dac9" },
    ],
    sizes: ["ONE SIZE"],
    images: [
      img("Leather Tote", "Accessories", "noir", 0),
      img("Leather Tote", "Accessories", "cognac", 1),
      img("Leather Tote", "Accessories", "bone", 2),
    ],
    badges: ["New", "Best Seller"],
    rating: 4.8,
    reviewCount: 234,
    inventory: 78,
    material: "Full-Grain Italian Leather",
    care: "Wipe clean with damp cloth. Use leather conditioner monthly.",
    isNew: true,
    isBestSeller: true,
    tags: ["bag", "tote", "accessory", "leather", "womens"],
  },
  {
    id: "w-011",
    slug: "high-rise-skinny-denim",
    name: "High-Rise Skinny Denim",
    subtitle: "High-rise stretch skinny in Japanese denim",
    description:
      "A high-rise skinny jean cut from 12oz Japanese stretch denim with a true-to-size top block and a tapered leg. The Skinny features five-pocket construction, copper rivets, and a button fly. Engineered with just enough stretch to move with you while holding its shape all day. Made on vintage shuttle looms in Okayama.",
    price: 6800,
    currency: "EGP",
    category: "Pants",
    collection: "Core Essentials",
    colors: [
      { name: "Indigo Raw", hex: "#1a2960" },
      { name: "Washed Black", hex: "#1a1a1a" },
      { name: "Stone Wash", hex: "#a0a8b8" },
    ],
    sizes: ["XS", "S", "M", "L", "XL"],
    images: [
      img("Skinny Denim", "Pants", "indigo raw", 0),
      img("Skinny Denim", "Pants", "washed black", 1),
      img("Skinny Denim", "Pants", "stone wash", 2),
    ],
    badges: ["Japanese", "Stretch"],
    rating: 4.8,
    reviewCount: 421,
    inventory: 91,
    material: "98% Cotton, 2% Elastane (12oz Japanese Denim)",
    care: "Wash sparingly, inside out, cold water. Hang dry.",
    isTrending: true,
    tags: ["denim", "jeans", "skinny", "japanese", "womens"],
  },
  {
    id: "w-012",
    slug: "minimal-leather-loafer",
    name: "Minimal Leather Loafer",
    subtitle: "Low-profile loafer in Italian nappa leather",
    description:
      "A low-profile minimalist loafer crafted from Italian nappa leather with a tonal rubber sole. The Loafer features a clean almond toe, blind-stitched seams, and a memory-foam footbed for all-day comfort. Tonal stitched MEME wordmark at the heel. Designed to be worn with everything from denim to dresses. A modern classic.",
    price: 8900,
    currency: "EGP",
    category: "Footwear",
    collection: "Core Essentials",
    colors: [
      { name: "Noir", hex: "#0d0d0d" },
      { name: "Bone", hex: "#e3dac9" },
      { name: "Cognac", hex: "#9a3833" },
    ],
    sizes: ["S", "M", "L", "XL"],
    images: [
      img("Leather Loafer", "Footwear", "noir", 0),
      img("Leather Loafer", "Footwear", "bone", 1),
      img("Leather Loafer", "Footwear", "cognac", 2),
    ],
    badges: ["Best Seller", "Italian Leather"],
    rating: 4.9,
    reviewCount: 678,
    inventory: 47,
    material: "Italian Nappa Leather, Rubber Sole",
    care: "Wipe clean with damp cloth. Use leather conditioner monthly.",
    isBestSeller: true,
    isTrending: true,
    tags: ["loafer", "shoes", "leather", "footwear", "womens"],
  },
];

// ============ Collections ============
export const collections = [
  {
    slug: "atelier-noir",
    name: "Atelier Noir",
    tagline: "Tailored essentials in depth-of-color black",
    description:
      "Our tailoring capsule — precision-cut blazer dresses, overcoats, silk trousers, and pencil skirts in Italian wools and leathers. Designed for the modern Egyptian woman who demands both structure and ease.",
    image: editorialImg("Atelier Noir Collection", "noir", 1600, 900),
    count: products.filter((p) => p.collection === "Atelier Noir").length,
  },
  {
    slug: "core-essentials",
    name: "Core Essentials",
    tagline: "The foundation of every great wardrobe",
    description:
      "Cashmere hoodies, fine merino knits, high-rise denim, and minimal loafers. The pieces you reach for every day, engineered to outlive every trend cycle.",
    image: editorialImg("Core Essentials Collection", "bone", 1600, 900),
    count: products.filter((p) => p.collection === "Core Essentials").length,
  },
  {
    slug: "premium-brands",
    name: "Premium Brands",
    tagline: "Top brands, one store — Zara, H&M, Lacoste, Adidas & more",
    description:
      "Discover more than 30 brands in one place. The premium branded catalog you love — Zara, H&M, Lacoste, Adidas, Hollister, Pull&Bear, Bershka, Hugo Boss — shipped fast across Egypt with cash on delivery.",
    image: editorialImg("Premium Brands Collection", "gold", 1600, 900),
    count: products.filter((p) => p.collection === "Premium Brands").length,
  },
];

// ============ Categories ============
export const categories = [
  { slug: "all", name: "All" },
  { slug: "Dresses", name: "Dresses" },
  { slug: "Tailoring", name: "Tailoring" },
  { slug: "Outerwear", name: "Outerwear" },
  { slug: "Knitwear", name: "Knitwear" },
  { slug: "Hoodies & Sweatshirts", name: "Hoodies" },
  { slug: "Tops", name: "Tops" },
  { slug: "Skirts", name: "Skirts" },
  { slug: "Pants", name: "Pants" },
  { slug: "Footwear", name: "Footwear" },
  { slug: "Accessories", name: "Accessories" },
];

// ============ Helper queries ============
export const getProductBySlug = (slug: string) =>
  products.find((p) => p.slug === slug);

export const getProductsByCategory = (category: string) =>
  category === "all" ? products : products.filter((p) => p.category === category);

export const getProductsByCollection = (collection: string) =>
  products.filter((p) => p.collection.toLowerCase().replace(/\s+/g, "-") === collection);

export const getNewArrivals = () => products.filter((p) => p.isNew);
export const getBestSellers = () => products.filter((p) => p.isBestSeller);
export const getTrending = () => products.filter((p) => p.isTrending);
export const getLimited = () => products.filter((p) => p.isLimited);

export const getRelatedProducts = (product: Product, count = 4) =>
  products
    .filter((p) => p.id !== product.id && (p.category === product.category || p.collection === product.collection))
    .slice(0, count);

// ============ All filters helper ============
export const allColors = Array.from(
  new Set(products.flatMap((p) => p.colors.map((c) => c.name)))
).sort();

export const allSizes: ProductSize[] = ["XS", "S", "M", "L", "XL", "XXL", "ONE SIZE"];

export const priceRange = {
  min: Math.min(...products.map((p) => p.price)),
  max: Math.max(...products.map((p) => p.price)),
};

// ============ Reviews ============
export type Review = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  title: string;
  body: string;
  date: string;
  verified: boolean;
  helpful: number;
};

export const reviews: Review[] = [
  {
    id: "r-001",
    productId: "w-001",
    author: "Salma A.",
    rating: 5,
    title: "Better than suits costing 2x",
    body: "The drape is incredible. The canvassed construction gives it a presence I wasn't expecting at this price point. Wore it to a gallery opening in Zamalek and got three compliments in the first hour. The wool feels substantial without being heavy, and the cut is sharp without being costume-y. This is the only blazer dress I'll need for years.",
    date: "2025-09-14",
    verified: true,
    helpful: 47,
  },
  {
    id: "r-002",
    productId: "w-001",
    author: "Menna T.",
    rating: 5,
    title: "Tailored to perfection",
    body: "I'm a stylist and this is now in regular rotation for client fittings. The shoulder construction is the real standout — structured but not stiff. Sizing is true to size. The Noir black is a true deep black, not the slightly-blue black you get from cheaper wools.",
    date: "2025-08-22",
    verified: true,
    helpful: 38,
  },
  {
    id: "r-003",
    productId: "w-002",
    author: "Nour K.",
    rating: 5,
    title: "Cashmere that lasts",
    body: "I've bought a lot of hoodies and this is the first one that actually feels luxe without being stiff. The cashmere blend is brushed on the inside and gets softer with every wash. The boxy fit is exactly what I wanted. Worth every pound.",
    date: "2025-10-02",
    verified: true,
    helpful: 62,
  },
  {
    id: "r-004",
    productId: "w-005",
    author: "Farida R.",
    rating: 5,
    title: "The only slip dress I'll wear",
    body: "Bought three. The silk is in a different league than the basic slip dresses I used to buy. The bias cut skims every curve without clinging. Holds its shape after dozens of washes. The tonal embroidery is a quiet flex.",
    date: "2025-09-30",
    verified: true,
    helpful: 89,
  },
  {
    id: "r-005",
    productId: "w-007",
    author: "Laila S.",
    rating: 5,
    title: "A real heirloom piece",
    body: "This jacket will outlive me. The lambskin is butter-soft from day one and the construction is impeccable. The asymmetric zip hits perfectly. Save up and buy it — you won't regret it.",
    date: "2025-07-18",
    verified: true,
    helpful: 51,
  },
  {
    id: "r-006",
    productId: "w-011",
    author: "Hana M.",
    rating: 5,
    title: "Holds shape all day",
    body: "Six months in and the denim still looks fresh. The high rise is perfect and the stretch holds without bagging out. The fit is true skinny — not jegging-tight. The Okayama denim is the real deal.",
    date: "2025-10-12",
    verified: true,
    helpful: 73,
  },
];

export const getReviewsForProduct = (productId: string) =>
  reviews.filter((r) => r.productId === productId);
