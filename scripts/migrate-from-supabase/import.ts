/**
 * Import the JSON dumps produced by export.ts into the self-hosted
 * Postgres (via Drizzle) + MinIO. Idempotent/rerunnable: every insert uses
 * `onConflictDoNothing()` keyed on the primary key (UUIDs are preserved
 * verbatim from Supabase, so a rerun just no-ops on already-imported rows)
 * — safe to run twice if a prior run was interrupted partway through.
 *
 * IMPORTANT: run this against a throwaway/dev Postgres+MinIO first
 * (docker-compose.dev.yml) and verify row counts/spot-check data before
 * ever pointing DATABASE_URL/MINIO_* at anything production-adjacent.
 *
 * Usage:
 *   DATABASE_URL=... MINIO_ENDPOINT=... MINIO_ACCESS_KEY=... MINIO_SECRET_KEY=... \
 *   npx tsx scripts/migrate-from-supabase/import.ts
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../../src/lib/db/schema";
import { uploadBuffer } from "../../src/lib/storage/client";

const DUMP_DIR = path.join(__dirname, "dump");

function load<T = unknown[]>(table: string): T {
  const file = path.join(DUMP_DIR, `${table}.json`);
  if (!existsSync(file)) {
    console.warn(`no dump for ${table}, skipping`);
    return [] as unknown as T;
  }
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

const sql = postgres(process.env.DATABASE_URL!, { max: 5 });
const db = drizzle(sql, { schema });

type AuthUser = {
  id: string;
  email: string;
  email_confirmed_at?: string | null;
  created_at: string;
  identities?: { provider: string; identity_data?: { sub?: string } }[];
};

/** Decode a `data:image/...;base64,...` string into a Buffer + content type. */
function decodeDataUrl(dataUrl: string): { buffer: Buffer; contentType: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { buffer: Buffer.from(match[2], "base64"), contentType: match[1] };
}

async function migrateImageUrl(url: string, bucket: string, keyHint: string): Promise<string> {
  if (!url.startsWith("data:image")) return url; // already a real URL, leave as-is

  const decoded = decodeDataUrl(url);
  if (!decoded) {
    console.warn(`  could not decode base64 image for ${keyHint}, leaving as-is (will not render)`);
    return url;
  }

  try {
    const sharp = (await import("sharp")).default;
    const webp = await sharp(decoded.buffer)
      .rotate()
      .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();
    const objectPath = `${keyHint}-${Date.now()}.webp`;
    const publicUrl = await uploadBuffer(bucket, objectPath, webp, "image/webp");
    console.log(`  converted base64 image -> ${publicUrl}`);
    return publicUrl;
  } catch (e) {
    console.warn(`  image conversion failed for ${keyHint}: ${e instanceof Error ? e.message : String(e)}`);
    return url;
  }
}

async function main() {
  console.log("=== Importing auth users -> users + oauth_accounts ===");
  const authUsers = load<AuthUser[]>("auth_users");
  for (const u of authUsers) {
    await db
      .insert(schema.users)
      .values({
        id: u.id,
        email: u.email.toLowerCase(),
        passwordHash: null, // Supabase doesn't expose usable password hashes — see MIGRATION_RUNBOOK.md
        emailVerifiedAt: u.email_confirmed_at ? new Date(u.email_confirmed_at) : null,
        createdAt: new Date(u.created_at),
      })
      .onConflictDoNothing();

    const googleIdentity = u.identities?.find((i) => i.provider === "google");
    if (googleIdentity?.identity_data?.sub) {
      await db
        .insert(schema.oauthAccounts)
        .values({ userId: u.id, provider: "google", providerAccountId: googleIdentity.identity_data.sub })
        .onConflictDoNothing();
    }
  }
  console.log(`imported ${authUsers.length} users`);

  console.log("=== categories / collections ===");
  for (const c of load<any[]>("categories")) {
    await db
      .insert(schema.categories)
      .values({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description,
        parentId: c.parent_id,
        imageUrl: c.image_url,
        sortOrder: c.sort_order,
        isActive: c.is_active,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })
      .onConflictDoNothing();
  }
  for (const c of load<any[]>("collections")) {
    await db
      .insert(schema.collections)
      .values({
        id: c.id,
        slug: c.slug,
        name: c.name,
        tagline: c.tagline,
        description: c.description,
        imageUrl: c.image_url,
        bannerUrl: c.banner_url,
        sortOrder: c.sort_order,
        isFeatured: c.is_featured,
        isActive: c.is_active,
        launchAt: c.launch_at ? new Date(c.launch_at) : null,
        endsAt: c.ends_at ? new Date(c.ends_at) : null,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })
      .onConflictDoNothing();
  }

  console.log("=== products ===");
  for (const p of load<any[]>("products")) {
    await db
      .insert(schema.products)
      .values({
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description,
        price: String(p.price),
        compareAtPrice: p.compare_at_price != null ? String(p.compare_at_price) : null,
        currency: p.currency,
        categoryId: p.category_id,
        categoryName: p.category_name,
        collectionId: p.collection_id,
        collectionName: p.collection_name,
        material: p.material,
        care: p.care,
        inventory: p.inventory,
        lowStockThreshold: p.low_stock_threshold,
        sku: p.sku,
        status: p.status,
        rating: p.rating != null ? String(p.rating) : "5.0",
        reviewCount: p.review_count,
        isNew: p.is_new,
        isBestSeller: p.is_best_seller,
        isTrending: p.is_trending,
        isLimited: p.is_limited,
        badges: p.badges ?? [],
        tags: p.tags ?? [],
        weightGrams: p.weight_grams,
        metaTitle: p.meta_title,
        metaDescription: p.meta_description,
        colors: p.colors ?? [],
        sizes: p.sizes ?? [],
        publishedAt: p.published_at ? new Date(p.published_at) : null,
        createdAt: new Date(p.created_at),
        updatedAt: new Date(p.updated_at),
      })
      .onConflictDoNothing();
  }

  console.log("=== product_images (converting base64 rows to MinIO) ===");
  for (const img of load<any[]>("product_images")) {
    const url = await migrateImageUrl(img.url, "products", `product-${img.product_id}`);
    await db
      .insert(schema.productImages)
      .values({
        id: img.id,
        productId: img.product_id,
        url,
        alt: img.alt,
        sortOrder: img.sort_order,
        isPrimary: img.is_primary,
        createdAt: new Date(img.created_at),
      })
      .onConflictDoNothing();
  }

  console.log("=== customers ===");
  for (const c of load<any[]>("customers")) {
    await db
      .insert(schema.customers)
      .values({
        id: c.id,
        userId: c.auth_user_id,
        email: c.email,
        firstName: c.first_name,
        lastName: c.last_name,
        phone: c.phone,
        acceptsMarketing: c.accepts_marketing,
        tags: c.tags ?? [],
        notes: c.notes,
        totalOrders: c.total_orders,
        totalSpent: c.total_spent != null ? String(c.total_spent) : "0",
        lastOrderAt: c.last_order_at ? new Date(c.last_order_at) : null,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })
      .onConflictDoNothing();
  }

  console.log("=== addresses ===");
  for (const a of load<any[]>("addresses")) {
    await db
      .insert(schema.addresses)
      .values({
        id: a.id,
        customerId: a.customer_id,
        type: a.type,
        firstName: a.first_name,
        lastName: a.last_name,
        company: a.company,
        address1: a.address1,
        address2: a.address2,
        city: a.city,
        state: a.state,
        postalCode: a.postal_code,
        country: a.country,
        phone: a.phone,
        isDefault: a.is_default,
        createdAt: new Date(a.created_at),
        updatedAt: new Date(a.updated_at),
      })
      .onConflictDoNothing();
  }

  console.log("=== orders / order_items ===");
  for (const o of load<any[]>("orders")) {
    await db
      .insert(schema.orders)
      .values({
        id: o.id,
        orderNumber: o.order_number,
        customerId: o.customer_id,
        email: o.email,
        status: o.status,
        paymentStatus: o.payment_status,
        fulfillmentStatus: o.fulfillment_status,
        subtotal: String(o.subtotal),
        discountTotal: String(o.discount_total ?? 0),
        shippingTotal: String(o.shipping_total ?? 0),
        taxTotal: String(o.tax_total ?? 0),
        total: String(o.total),
        currency: o.currency,
        couponCode: o.coupon_code,
        shippingAddress: o.shipping_address,
        billingAddress: o.billing_address,
        shippingMethod: o.shipping_method,
        trackingNumber: o.tracking_number,
        trackingUrl: o.tracking_url,
        customerNote: o.customer_note,
        staffNote: o.staff_note,
        paymentIntentId: o.payment_intent_id,
        paymentMethod: o.payment_method,
        placedAt: o.placed_at ? new Date(o.placed_at) : null,
        paidAt: o.paid_at ? new Date(o.paid_at) : null,
        fulfilledAt: o.fulfilled_at ? new Date(o.fulfilled_at) : null,
        shippedAt: o.shipped_at ? new Date(o.shipped_at) : null,
        deliveredAt: o.delivered_at ? new Date(o.delivered_at) : null,
        cancelledAt: o.cancelled_at ? new Date(o.cancelled_at) : null,
        createdAt: new Date(o.created_at),
        updatedAt: new Date(o.updated_at),
      })
      .onConflictDoNothing();
  }
  for (const oi of load<any[]>("order_items")) {
    await db
      .insert(schema.orderItems)
      .values({
        id: oi.id,
        orderId: oi.order_id,
        productId: oi.product_id,
        productName: oi.product_name,
        productSlug: oi.product_slug,
        productImage: oi.product_image,
        variantColor: oi.variant_color,
        variantSize: oi.variant_size,
        sku: oi.sku,
        unitPrice: String(oi.unit_price),
        quantity: oi.quantity,
        total: String(oi.total),
        createdAt: new Date(oi.created_at),
      })
      .onConflictDoNothing();
  }

  console.log("=== coupons / reviews / wishlists ===");
  for (const c of load<any[]>("coupons")) {
    await db
      .insert(schema.coupons)
      .values({
        id: c.id,
        code: c.code,
        description: c.description,
        type: c.type,
        value: String(c.value),
        minSubtotal: String(c.min_subtotal ?? 0),
        maxUses: c.max_uses,
        usedCount: c.used_count,
        startsAt: c.starts_at ? new Date(c.starts_at) : null,
        endsAt: c.ends_at ? new Date(c.ends_at) : null,
        isActive: c.is_active,
        appliesTo: c.applies_to,
        createdAt: new Date(c.created_at),
        updatedAt: new Date(c.updated_at),
      })
      .onConflictDoNothing();
  }
  for (const r of load<any[]>("reviews")) {
    await db
      .insert(schema.reviews)
      .values({
        id: r.id,
        productId: r.product_id,
        customerId: r.customer_id,
        author: r.author,
        rating: r.rating,
        title: r.title,
        body: r.body,
        isVerified: r.is_verified,
        isPublished: r.is_published,
        helpful: r.helpful,
        response: r.response,
        responseAt: r.response_at ? new Date(r.response_at) : null,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })
      .onConflictDoNothing();
  }
  for (const w of load<any[]>("wishlists")) {
    await db
      .insert(schema.wishlists)
      .values({ id: w.id, customerId: w.customer_id, productId: w.product_id, createdAt: new Date(w.created_at) })
      .onConflictDoNothing();
  }

  console.log("=== staff_profiles / admin_allowed_emails ===");
  for (const s of load<any[]>("staff_profiles")) {
    await db
      .insert(schema.staffProfiles)
      .values({
        id: s.id,
        userId: s.auth_user_id,
        email: s.email,
        fullName: s.full_name,
        role: s.role,
        isActive: s.is_active,
        lastLoginAt: s.last_login_at ? new Date(s.last_login_at) : null,
        createdAt: new Date(s.created_at),
        updatedAt: new Date(s.updated_at),
      })
      .onConflictDoNothing();
  }
  for (const e of load<any[]>("admin_allowed_emails")) {
    await db
      .insert(schema.adminAllowedEmails)
      .values({ id: e.id, email: e.email, addedBy: e.added_by, createdAt: new Date(e.created_at) })
      .onConflictDoNothing();
  }

  console.log("=== homepage_settings ===");
  for (const h of load<any[]>("homepage_settings")) {
    await db
      .insert(schema.homepageSettings)
      .values({ id: h.id, config: h.config, updatedAt: new Date(h.updated_at) })
      .onConflictDoNothing();
  }

  console.log("=== returns (converting any base64 image_url) ===");
  for (const r of load<any[]>("returns")) {
    const imageUrl = r.image_url ? await migrateImageUrl(r.image_url, "returns", `return-${r.id}`) : null;
    await db
      .insert(schema.returns)
      .values({
        id: r.id,
        orderId: r.order_id,
        orderNumber: r.order_number,
        customerId: r.customer_id,
        customerEmail: r.customer_email,
        reason: r.reason,
        description: r.description,
        imageUrl,
        status: r.status,
        adminNote: r.admin_note,
        createdAt: new Date(r.created_at),
        updatedAt: new Date(r.updated_at),
      })
      .onConflictDoNothing();
  }

  console.log("\nDone. Spot-check row counts against the export logs before trusting this fully.");
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
