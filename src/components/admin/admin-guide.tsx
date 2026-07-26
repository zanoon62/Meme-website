"use client";

import * as React from "react";
import Link from "next/link";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Eye,
  RotateCcw,
  ShoppingCart,
  LayoutDashboard,
  BookOpen,
  Lightbulb,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * AdminGuideSection
 * An in-app, step-by-step walkthrough that explains to the store admin
 * exactly how to add, edit, delete and reset products from the Admin panel.
 */
export function AdminGuideSection() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Intro */}
      <div className="bg-background border border-border/60 rounded-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-2xl tracking-tight mb-2">
              How to manage your products
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This guide walks you through everything you can do from the{" "}
              <Link href="/admin" className="underline">Admin → Products</Link> tab:
              adding new pieces, editing existing ones, deleting out-of-stock items,
              and resetting the catalog back to its original state. Every change you
              save is pushed to the live storefront instantly — no publish step required.
            </p>
          </div>
        </div>
      </div>

      {/* Quick map */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickCard
          icon={Plus}
          label="Add a product"
          tone="default"
          href="#add"
        />
        <QuickCard
          icon={Pencil}
          label="Edit a product"
          tone="default"
          href="#edit"
        />
        <QuickCard
          icon={Trash2}
          label="Delete a product"
          tone="default"
          href="#delete"
        />
        <QuickCard
          icon={RotateCcw}
          label="Reset the catalog"
          tone="default"
          href="#reset"
        />
      </div>

      {/* Steps */}
      <Step
        id="add"
        number={1}
        icon={Plus}
        title="Add a new product"
        description="Use this workflow to publish a brand-new piece to your store. The product appears on the storefront the moment you click 'Create product'."
      >
        <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed list-decimal pl-5">
          <li>
            Open <Link href="/admin" className="underline text-foreground">Admin → Products</Link>{" "}
            from the sidebar (or tap the <kbd className="px-1.5 py-0.5 bg-accent rounded text-[10px] font-mono">Products</kbd> tab at the top of the admin home).
          </li>
          <li>
            Click the <span className="inline-flex items-center gap-1 text-foreground font-medium"><Plus className="h-3 w-3" /> Add product</span>{" "}
            button in the top-right of the products table.
          </li>
          <li>
            Fill in the <strong className="text-foreground">Basic information</strong> section: a memorable product name, a one-line subtitle, and a rich description (3+ sentences recommended for premium feel).
          </li>
          <li>
            Under <strong className="text-foreground">Pricing & inventory</strong>, set the price, optional compare-at price (for sale items), and how many units you have in stock.
          </li>
          <li>
            Pick a <strong className="text-foreground">Category</strong> (e.g. Dresses, Outerwear, Knitwear) and a <strong className="text-foreground">Collection</strong> (Atelier Noir or Core Essentials). Add searchable <strong className="text-foreground">tags</strong> and display <strong className="text-foreground">badges</strong>.
          </li>
          <li>
            In <strong className="text-foreground">Variants</strong>, add at least one color (with name + hex swatch) and toggle on the sizes you carry.
          </li>
          <li>
            Under <strong className="text-foreground">Media</strong>, paste full image URLs (Unsplash or your own CDN). The first image is used as the cover thumbnail across the site.
          </li>
          <li>
            Fill in <strong className="text-foreground">Material</strong> and <strong className="text-foreground">Care instructions</strong> — these appear on the product page in the "Material & Care" tab.
          </li>
          <li>
            Toggle any merchandising flags you want: <Badge variant="outline" className="text-[10px]">New</Badge>{" "}
            <Badge variant="outline" className="text-[10px]">Best Seller</Badge>{" "}
            <Badge variant="outline" className="text-[10px]">Trending</Badge>{" "}
            <Badge variant="outline" className="text-[10px]">Limited</Badge>. Each one places the product in the corresponding homepage section.
          </li>
          <li>
            Click <span className="inline-flex items-center gap-1 text-foreground font-medium">Create product</span>. You'll see a success toast and the new product will appear at the top of the products table.
          </li>
        </ol>
        <Callout>
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>Tip:</strong> Leave the URL slug blank to auto-generate one from the product name. You can always edit it later.
          </span>
        </Callout>
      </Step>

      <Step
        id="edit"
        number={2}
        icon={Pencil}
        title="Edit an existing product"
        description="Update pricing, inventory, colors, images, or any other field. Changes are saved to the live storefront instantly."
      >
        <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed list-decimal pl-5">
          <li>Open <Link href="/admin" className="underline text-foreground">Admin → Products</Link>.</li>
          <li>
            Find the row for the product you want to change. Use the search box in the top bar to filter by name if needed.
          </li>
          <li>
            Click the <span className="inline-flex items-center gap-1 text-foreground font-medium"><Pencil className="h-3 w-3" /> Edit</span>{" "}
            button on the right side of that row. The product form dialog opens pre-filled with the current values.
          </li>
          <li>
            Change any field — price, inventory, colors, images, flags, etc. The form validates required fields as you go.
          </li>
          <li>
            Click <span className="inline-flex items-center gap-1 text-foreground font-medium">Save changes</span>. The updated product immediately reflects across the storefront (home, shop, collection, product page, cart, search).
          </li>
        </ol>
        <Callout>
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>Tip:</strong> To quickly take a product offline without deleting it, set its inventory to 0 — it will display as "Sold out" instead of disappearing from the catalog.
          </span>
        </Callout>
      </Step>

      <Step
        id="delete"
        number={3}
        icon={Trash2}
        title="Delete a product"
        description="Permanently remove a product from your catalog. A confirmation dialog prevents accidental deletions."
      >
        <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed list-decimal pl-5">
          <li>Open <Link href="/admin" className="underline text-foreground">Admin → Products</Link>.</li>
          <li>Find the product row.</li>
          <li>
            Click the <span className="inline-flex items-center gap-1 text-foreground font-medium"><Trash2 className="h-3 w-3" /> Delete</span>{" "}
            button (red icon on the right).
          </li>
          <li>
            A confirmation dialog will appear showing the product name. Click{" "}
            <span className="text-foreground font-medium">Delete</span> to confirm, or{" "}
            <span className="text-foreground font-medium">Cancel</span> to keep the product.
          </li>
          <li>
            The product disappears from the storefront immediately. Existing carts and wishlists that referenced it will simply skip the missing item.
          </li>
        </ol>
        <Callout tone="warning">
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>Heads up:</strong> Deletions are irreversible from the UI. If you want a "soft" removal, set inventory to 0 or toggle off all merchandising flags instead of deleting.
          </span>
        </Callout>
      </Step>

      <Step
        id="reset"
        number={4}
        icon={RotateCcw}
        title="Reset the catalog"
        description="Restore the original 12-piece MEME women's catalog. Useful for demos or if you want to start fresh."
      >
        <ol className="space-y-3 text-sm text-muted-foreground leading-relaxed list-decimal pl-5">
          <li>Open <Link href="/admin" className="underline text-foreground">Admin → Products</Link>.</li>
          <li>
            Click the <span className="inline-flex items-center gap-1 text-foreground font-medium"><RotateCcw className="h-3 w-3" /> Reset catalog</span>{" "}
            button in the table header (next to the Add product button).
          </li>
          <li>Confirm in the dialog. All admin edits are discarded and the original seed catalog is restored.</li>
        </ol>
        <Callout>
          <Lightbulb className="h-4 w-4 flex-shrink-0" />
          <span>
            <strong>How persistence works:</strong> Admin edits are stored in your browser's localStorage under the key{" "}
            <code className="px-1 py-0.5 bg-accent rounded text-[11px] font-mono">meme-admin-products</code>. They survive page reloads, but are scoped per browser. In a production deployment you'd swap this client-side store for authenticated API calls to your backend (Prisma/Postgres).
          </span>
        </Callout>
      </Step>

      {/* Related sections */}
      <div className="bg-background border border-border/60 rounded-sm p-6">
        <h3 className="font-display text-xl tracking-tight mb-4">Other admin sections</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <RelatedRow
            icon={LayoutDashboard}
            title="Dashboard"
            desc="KPIs, revenue & traffic charts, recent orders at a glance."
          />
          <RelatedRow
            icon={ShoppingCart}
            title="Orders"
            desc="Browse and search the full order history with status filters."
          />
          <RelatedRow
            icon={Eye}
            title="Customers"
            desc="Top customers, lifetime value, tier breakdown."
          />
          <RelatedRow
            icon={Package}
            title="Reviews"
            desc="Moderate customer reviews and approve before publishing."
          />
        </div>
      </div>

      {/* CTA */}
      <div className="bg-foreground text-background rounded-sm p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl tracking-tight mb-1">Ready to add your first product?</h3>
          <p className="text-sm opacity-80">Jump straight to the Products tab and click "Add product".</p>
        </div>
        <Button asChild size="lg" variant="secondary" className="rounded-full">
          <Link href="/admin">
            Go to Products <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function QuickCard({
  icon: Icon,
  label,
  tone,
  href,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tone: "default";
  href: string;
}) {
  return (
    <a
      href={href}
      className="bg-background border border-border/60 rounded-sm p-4 hover:border-foreground transition-colors group"
    >
      <Icon className="h-5 w-5 mb-2" />
      <p className="text-sm font-medium">{label}</p>
    </a>
  );
}

function Step({
  id,
  number,
  icon: Icon,
  title,
  description,
  children,
}: {
  id: string;
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="bg-background border border-border/60 rounded-sm p-6 scroll-mt-24"
    >
      <div className="flex items-start gap-4 mb-5">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center font-display text-lg">
            {number}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-xl tracking-tight">{title}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>
      </div>
      <div className="sm:pl-14">{children}</div>
    </section>
  );
}

function Callout({
  children,
  tone = "info",
}: {
  children: React.ReactNode;
  tone?: "info" | "warning";
}) {
  return (
    <div
      className={
        "mt-5 flex items-start gap-3 p-4 rounded-sm border text-sm " +
        (tone === "warning"
          ? "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-200"
          : "bg-accent/40 border-border/60 text-foreground")
      }
    >
      {children}
    </div>
  );
}

function RelatedRow({
  icon: Icon,
  title,
  desc,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 border border-border/40 rounded-sm">
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
