/**
 * Demo mode persistence layer
 *
 * When Supabase is NOT configured, the app runs in "demo mode" and mutations
 * need to persist somewhere. This module uses an in-memory store with seed
 * data, and exposes helpers to mutate it.
 *
 * For real persistence across requests in demo mode, we also write to
 * localStorage on the client side via the product-store. For server-side
 * demo mutations (orders, categories, collections, coupons), we keep an
 * in-memory cache that lasts for the lifetime of the server process.
 *
 * In production with Supabase configured, this module is not used.
 */

import { categories as seedCategories, collections as seedCollections } from "@/data/products";

// ---------- Types ----------
export type DemoOrder = {
  id: string;
  order_number: string;
  customer_id: string | null;
  email: string;
  status: "pending" | "paid" | "fulfilled" | "shipped" | "delivered" | "cancelled" | "refunded";
  payment_status: "awaiting" | "paid" | "refunded" | "failed";
  fulfillment_status: "unfulfilled" | "fulfilled" | "shipped" | "delivered" | "cancelled";
  subtotal: number;
  discount_total: number;
  shipping_total: number;
  tax_total: number;
  total: number;
  currency: string;
  coupon_code: string | null;
  shipping_address: {
    first_name: string;
    last_name: string;
    address1: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  tracking_number?: string | null;
  staff_note?: string | null;
  placed_at: string;
  paid_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  created_at: string;
};

export type DemoOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  variant_color: string | null;
  variant_size: string | null;
  variant: string | null;
  quantity: number;
  unit_price: number;
  total: number;
  product_image: string | null;
};

export type DemoCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  products_count: number;
};

export type DemoCollection = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  cover_image: string | null;
  is_featured: boolean;
  is_active: boolean;
  sort_order: number;
  products_count: number;
};

export type DemoCoupon = {
  id: string;
  code: string;
  type: "percent" | "fixed" | "shipping";
  value: number;
  min_subtotal: number;
  usage_count: number;
  usage_limit: number | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type DemoCustomer = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  accepts_marketing: boolean;
  total_orders: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
};

export type DemoReview = {
  id: string;
  product_id: string;
  product_name: string;
  customer_name: string;
  rating: number;
  title: string;
  body: string;
  is_published: boolean;
  is_verified: boolean;
  public_response: string | null;
  created_at: string;
};

// ---------- Seed data ----------
const seedOrders: DemoOrder[] = [
  {
    id: "demo-o-1",
    order_number: "MEME-250101-000001",
    customer_id: "demo-c-1",
    email: "salma.ahmed@example.com",
    status: "delivered",
    payment_status: "paid",
    fulfillment_status: "delivered",
    subtotal: 14500,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 2030,
    total: 16530,
    currency: "EGP",
    coupon_code: null,
    shipping_address: {
      first_name: "Salma",
      last_name: "Ahmed",
      address1: "12 Taha Hussein St., Zamalek",
      city: "Cairo",
      state: "Cairo",
      postal_code: "11211",
      country: "EG",
    },
    tracking_number: "EMS-EG-2025-001847",
    staff_note: "VIP customer — included hand-written thank-you card.",
    placed_at: "2025-09-14T10:30:00Z",
    paid_at: "2025-09-14T10:30:00Z",
    delivered_at: "2025-09-17T16:00:00Z",
    created_at: "2025-09-14T10:30:00Z",
  },
  {
    id: "demo-o-2",
    order_number: "MEME-250103-000002",
    customer_id: "demo-c-2",
    email: "nour.khaled@example.com",
    status: "shipped",
    payment_status: "paid",
    fulfillment_status: "shipped",
    subtotal: 7800,
    discount_total: 780,
    shipping_total: 0,
    tax_total: 983,
    total: 8003,
    currency: "EGP",
    coupon_code: "ATELIER10",
    shipping_address: {
      first_name: "Nour",
      last_name: "Khaled",
      address1: "45 Saif El-Din St., Smouha",
      city: "Alexandria",
      state: "Alexandria",
      postal_code: "21521",
      country: "EG",
    },
    tracking_number: "EMS-EG-2025-001923",
    staff_note: null,
    placed_at: "2025-10-02T14:20:00Z",
    paid_at: "2025-10-02T14:20:00Z",
    shipped_at: "2025-10-03T09:00:00Z",
    created_at: "2025-10-02T14:20:00Z",
  },
  {
    id: "demo-o-3",
    order_number: "MEME-250105-000003",
    customer_id: "demo-c-3",
    email: "farida.mahmoud@example.com",
    status: "pending",
    payment_status: "awaiting",
    fulfillment_status: "unfulfilled",
    subtotal: 38500,
    discount_total: 0,
    shipping_total: 75,
    tax_total: 5390,
    total: 43965,
    currency: "EGP",
    coupon_code: null,
    shipping_address: {
      first_name: "Farida",
      last_name: "Mahmoud",
      address1: "8 Corniche Rd., El Nozha",
      city: "Cairo",
      state: "Cairo",
      postal_code: "11811",
      country: "EG",
    },
    tracking_number: null,
    staff_note: null,
    placed_at: "2025-10-12T08:45:00Z",
    created_at: "2025-10-12T08:45:00Z",
  },
  {
    id: "demo-o-4",
    order_number: "MEME-250108-000004",
    customer_id: "demo-c-4",
    email: "hana.youssef@example.com",
    status: "paid",
    payment_status: "paid",
    fulfillment_status: "unfulfilled",
    subtotal: 26500,
    discount_total: 0,
    shipping_total: 0,
    tax_total: 3710,
    total: 30210,
    currency: "EGP",
    coupon_code: null,
    shipping_address: {
      first_name: "Hana",
      last_name: "Youssef",
      address1: "21 Gamet El Dewal St., Mohandessin",
      city: "Giza",
      state: "Giza",
      postal_code: "12411",
      country: "EG",
    },
    tracking_number: null,
    staff_note: "Customer requested gift wrapping.",
    placed_at: "2025-10-15T11:00:00Z",
    paid_at: "2025-10-15T11:00:00Z",
    created_at: "2025-10-15T11:00:00Z",
  },
];

const seedOrderItems: DemoOrderItem[] = [
  // Order 1: Salma - Blazer Dress
  { id: "oi-1", order_id: "demo-o-1", product_id: "p-001", product_name: "Noir Tailored Blazer Dress", variant_color: "Noir", variant_size: "S", variant: "Noir / S", quantity: 1, unit_price: 14500, total: 14500, product_image: "/api/product-img?name=Noir+Blazer+Dress&category=Tailoring&color=noir&idx=0&w=400&h=500" },
  // Order 2: Nour - Cashmere Hoodie (with 10% discount)
  { id: "oi-2", order_id: "demo-o-2", product_id: "p-002", product_name: "Cashmere Oversized Hoodie", variant_color: "Bone", variant_size: "M", variant: "Bone / M", quantity: 1, unit_price: 7800, total: 7020, product_image: "/api/product-img?name=Cashmere+Hoodie&category=Knitwear&color=bone&idx=0&w=400&h=500" },
  // Order 3: Farida - Leather Moto Jacket
  { id: "oi-3", order_id: "demo-o-3", product_id: "p-007", product_name: "Cropped Leather Moto Jacket", variant_color: "Noir", variant_size: "M", variant: "Noir / M", quantity: 1, unit_price: 38500, total: 38500, product_image: "/api/product-img?name=Leather+Moto+Jacket&category=Outerwear&color=noir&idx=0&w=400&h=500" },
  // Order 4: Hana - Camel Overcoat
  { id: "oi-4", order_id: "demo-o-4", product_id: "p-004", product_name: "Atelier Camel Overcoat", variant_color: "Camel", variant_size: "S", variant: "Camel / S", quantity: 1, unit_price: 26500, total: 26500, product_image: "/api/product-img?name=Camel+Overcoat&category=Outerwear&color=camel&idx=0&w=400&h=500" },
];

const seedCustomers: DemoCustomer[] = [
  {
    id: "demo-c-1",
    email: "salma.ahmed@example.com",
    first_name: "Salma",
    last_name: "Ahmed",
    phone: "+20 100 123 4567",
    accepts_marketing: true,
    total_orders: 4,
    total_spent: 62300,
    last_order_at: "2025-09-14T10:30:00Z",
    created_at: "2025-06-22T09:15:00Z",
  },
  {
    id: "demo-c-2",
    email: "nour.khaled@example.com",
    first_name: "Nour",
    last_name: "Khaled",
    phone: "+20 122 555 0192",
    accepts_marketing: true,
    total_orders: 2,
    total_spent: 15803,
    last_order_at: "2025-10-02T14:20:00Z",
    created_at: "2025-07-08T11:42:00Z",
  },
  {
    id: "demo-c-3",
    email: "farida.mahmoud@example.com",
    first_name: "Farida",
    last_name: "Mahmoud",
    phone: "+20 111 222 3344",
    accepts_marketing: false,
    total_orders: 7,
    total_spent: 198450,
    last_order_at: "2025-10-12T08:45:00Z",
    created_at: "2025-01-15T18:30:00Z",
  },
  {
    id: "demo-c-4",
    email: "hana.youssef@example.com",
    first_name: "Hana",
    last_name: "Youssef",
    phone: "+20 100 444 5566",
    accepts_marketing: true,
    total_orders: 3,
    total_spent: 74210,
    last_order_at: "2025-10-15T11:00:00Z",
    created_at: "2025-03-30T22:10:00Z",
  },
  {
    id: "demo-c-5",
    email: "laila.mostafa@example.com",
    first_name: "Laila",
    last_name: "Mostafa",
    phone: "+20 122 666 7788",
    accepts_marketing: true,
    total_orders: 1,
    total_spent: 8900,
    last_order_at: "2025-10-10T13:15:00Z",
    created_at: "2025-09-01T10:00:00Z",
  },
];

const seedDemoCategories: DemoCategory[] = seedCategories.map((c, i) => ({
  id: `demo-cat-${i}`,
  slug: c.slug,
  name: c.name,
  description: null,
  image_url: null,
  sort_order: i,
  is_active: true,
  products_count: c.slug === "all" ? 12 : Math.floor(Math.random() * 4) + 1,
}));

const seedDemoCollections: DemoCollection[] = seedCollections.map((c, i) => ({
  id: `demo-col-${i}`,
  slug: c.slug,
  name: c.name,
  tagline: c.tagline ?? null,
  description: null,
  cover_image: c.image ?? null,
  is_featured: i === 0,
  is_active: true,
  sort_order: i,
  products_count: Math.floor(Math.random() * 5) + 2,
}));

const seedCoupons: DemoCoupon[] = [
  { id: "cp-1", code: "ATELIER10", type: "percent", value: 10, min_subtotal: 0, usage_count: 47, usage_limit: null, is_active: true, expires_at: null, created_at: "2025-01-01T00:00:00Z" },
  { id: "cp-2", code: "WELCOME15", type: "percent", value: 15, min_subtotal: 5000, usage_count: 23, usage_limit: 100, is_active: true, expires_at: "2025-12-31T23:59:59Z", created_at: "2025-01-01T00:00:00Z" },
  { id: "cp-3", code: "FREESHIP", type: "shipping", value: 0, min_subtotal: 7500, usage_count: 89, usage_limit: null, is_active: true, expires_at: null, created_at: "2025-01-01T00:00:00Z" },
  { id: "cp-4", code: "FLAT500", type: "fixed", value: 500, min_subtotal: 5000, usage_count: 12, usage_limit: null, is_active: false, expires_at: "2025-09-30T23:59:59Z", created_at: "2025-01-01T00:00:00Z" },
];

const seedReviews: DemoReview[] = [
  { id: "rv-1", product_id: "p-001", product_name: "Noir Tailored Blazer Dress", customer_name: "Salma Ahmed", rating: 5, title: "Perfectly tailored", body: "The fit is impeccable and the wool feels luxurious. Wore it to a wedding and got so many compliments.", is_published: true, is_verified: true, public_response: "Thank you Salma! So glad you love it.", created_at: "2025-09-20T10:00:00Z" },
  { id: "rv-2", product_id: "p-002", product_name: "Cashmere Oversized Hoodie", customer_name: "Nour Khaled", rating: 5, title: "Cozy luxury", body: "Worth every pound. The cashmere is so soft and the oversized fit is exactly what I wanted.", is_published: true, is_verified: true, public_response: null, created_at: "2025-10-05T14:00:00Z" },
  { id: "rv-3", product_id: "p-004", product_name: "Atelier Camel Overcoat", customer_name: "Farida Mahmoud", rating: 4, title: "Beautiful coat", body: "The color is gorgeous and the wool is heavy. Runs slightly large but that's the style.", is_published: false, is_verified: true, public_response: null, created_at: "2025-10-13T09:00:00Z" },
  { id: "rv-4", product_id: "p-007", product_name: "Cropped Leather Moto Jacket", customer_name: "Hana Youssef", rating: 5, title: "Investment piece", body: "The leather quality is incredible. This will last me years. Highly recommend.", is_published: true, is_verified: true, public_response: null, created_at: "2025-10-16T11:30:00Z" },
  { id: "rv-5", product_id: "p-005", product_name: "Bias-Cut Silk Slip Dress", customer_name: "Laila Mostafa", rating: 4, title: "Elegant", body: "The silk drapes beautifully. Slightly sheer so I wear a slip underneath.", is_published: false, is_verified: false, public_response: null, created_at: "2025-10-11T16:00:00Z" },
];

// ---------- In-memory store (per server process) ----------
const store = {
  orders: [...seedOrders],
  orderItems: [...seedOrderItems],
  categories: [...seedDemoCategories],
  collections: [...seedDemoCollections],
  coupons: [...seedCoupons],
  customers: [...seedCustomers],
  reviews: [...seedReviews],
};

// ---------- Public API ----------
export const demoStore = {
  // Orders
  listOrders(): DemoOrder[] {
    return [...store.orders];
  },
  listOrderItems(): DemoOrderItem[] {
    return [...store.orderItems];
  },
  updateOrder(id: string, patch: Partial<DemoOrder>): DemoOrder | null {
    const idx = store.orders.findIndex((o) => o.id === id);
    if (idx === -1) return null;
    const now = new Date().toISOString();
    const next: DemoOrder = { ...store.orders[idx], ...patch };
    // Auto-set timestamp fields
    if (patch.status === "paid" && !next.paid_at) next.paid_at = now;
    if (patch.status === "shipped" && !next.shipped_at) next.shipped_at = now;
    if (patch.status === "delivered" && !next.delivered_at) next.delivered_at = now;
    if (patch.status === "cancelled" && !next.cancelled_at) next.cancelled_at = now;
    if (patch.status === "delivered") next.fulfillment_status = "delivered";
    if (patch.status === "shipped") next.fulfillment_status = "shipped";
    if (patch.status === "cancelled") next.fulfillment_status = "cancelled";
    if (patch.status === "paid") next.payment_status = "paid";
    store.orders[idx] = next;
    return next;
  },

  // Categories
  listCategories(): DemoCategory[] {
    return [...store.categories];
  },
  createCategory(input: { slug: string; name: string; description?: string; image_url?: string }): DemoCategory {
    const cat: DemoCategory = {
      id: `demo-cat-${Date.now()}`,
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      image_url: input.image_url ?? null,
      sort_order: store.categories.length,
      is_active: true,
      products_count: 0,
    };
    store.categories.push(cat);
    return cat;
  },

  // Collections
  listCollections(): DemoCollection[] {
    return [...store.collections];
  },
  createCollection(input: { slug: string; name: string; tagline?: string; description?: string; cover_image?: string; is_featured?: boolean }): DemoCollection {
    const col: DemoCollection = {
      id: `demo-col-${Date.now()}`,
      slug: input.slug,
      name: input.name,
      tagline: input.tagline ?? null,
      description: input.description ?? null,
      cover_image: input.cover_image ?? null,
      is_featured: input.is_featured ?? false,
      is_active: true,
      sort_order: store.collections.length,
      products_count: 0,
    };
    store.collections.push(col);
    return col;
  },

  // Coupons
  listCoupons(): DemoCoupon[] {
    return [...store.coupons];
  },
  createCoupon(input: { code: string; type: "percent" | "fixed" | "shipping"; value: number; min_subtotal?: number; usage_limit?: number }): DemoCoupon {
    const cp: DemoCoupon = {
      id: `cp-${Date.now()}`,
      code: input.code,
      type: input.type,
      value: input.value,
      min_subtotal: input.min_subtotal ?? 0,
      usage_count: 0,
      usage_limit: input.usage_limit ?? null,
      is_active: true,
      expires_at: null,
      created_at: new Date().toISOString(),
    };
    store.coupons.push(cp);
    return cp;
  },

  // Customers
  listCustomers(): DemoCustomer[] {
    return [...store.customers];
  },
  searchCustomers(q: string): DemoCustomer[] {
    if (!q) return [...store.customers];
    const lower = q.toLowerCase();
    return store.customers.filter(
      (c) =>
        c.email.toLowerCase().includes(lower) ||
        c.first_name.toLowerCase().includes(lower) ||
        c.last_name.toLowerCase().includes(lower),
    );
  },

  // Reviews
  listReviews(): DemoReview[] {
    return [...store.reviews];
  },
  updateReview(id: string, patch: Partial<DemoReview>): DemoReview | null {
    const idx = store.reviews.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    store.reviews[idx] = { ...store.reviews[idx], ...patch };
    return store.reviews[idx];
  },
};
