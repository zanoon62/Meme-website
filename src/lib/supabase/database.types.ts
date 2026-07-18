/**
 * Auto-generated-style type map for the MEME Supabase schema.
 * Mirror of supabase/schema.sql.
 *
 * For full type safety, after deploying the schema to Supabase,
 * run: `npx supabase gen types typescript --project-id <your-id>`
 * and replace this file. The hand-written version below works
 * with the current schema and is enough for development.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ProductStatus = "draft" | "active" | "archived";
export type OrderStatus =
  | "pending"
  | "paid"
  | "fulfilled"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";
export type PaymentStatus =
  | "awaiting"
  | "authorized"
  | "paid"
  | "partial_refund"
  | "refunded"
  | "failed";
export type FulfillmentStatus = "unfulfilled" | "partial" | "fulfilled";
export type CouponType = "percent" | "fixed" | "shipping";
export type Role = "admin" | "staff" | "customer";

export type ProductColor = { name: string; hex: string };
export type ProductSize = "XS" | "S" | "M" | "L" | "XL" | "XXL" | "ONE SIZE";

export type Database = {
   
  graphql_public: { Views: Record<string, never>; Functions: Record<string, never>; Enums: Record<string, never>; CompositeTypes: Record<string, never> };
  public: {
     
    Views: Record<string, never>;
    Functions: {
      generate_order_number: { Args: Record<string, never>; Returns: string };
    };
    Enums: {
      product_status: ProductStatus;
      order_status: OrderStatus;
      payment_status: PaymentStatus;
      fulfillment_status: FulfillmentStatus;
      coupon_type: CouponType;
      role: Role;
    };
     
    CompositeTypes: Record<string, never>;
    Tables: {
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          parent_id: string | null;
          image_url: string | null;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          parent_id?: string | null;
          image_url?: string | null;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
          Relationships: [];
      };
      collections: {
        Row: {
          id: string;
          slug: string;
          name: string;
          tagline: string | null;
          description: string | null;
          image_url: string | null;
          banner_url: string | null;
          sort_order: number;
          is_featured: boolean;
          is_active: boolean;
          launch_at: string | null;
          ends_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          tagline?: string | null;
          description?: string | null;
          image_url?: string | null;
          banner_url?: string | null;
          sort_order?: number;
          is_featured?: boolean;
          is_active?: boolean;
          launch_at?: string | null;
          ends_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["collections"]["Insert"]>;
          Relationships: [];
      };
      products: {
        Row: {
          id: string;
          slug: string;
          name: string;
          subtitle: string | null;
          description: string | null;
          price: number;
          compare_at_price: number | null;
          currency: string;
          category_id: string | null;
          category_name: string | null;
          collection_id: string | null;
          collection_name: string | null;
          colors: ProductColor[];
          sizes: ProductSize[];
          material: string | null;
          care: string | null;
          inventory: number;
          low_stock_threshold: number;
          sku: string | null;
          status: ProductStatus;
          rating: number;
          review_count: number;
          is_new: boolean;
          is_best_seller: boolean;
          is_trending: boolean;
          is_limited: boolean;
          badges: string[];
          tags: string[];
          weight_grams: number | null;
          meta_title: string | null;
          meta_description: string | null;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          subtitle?: string | null;
          description?: string | null;
          price: number;
          compare_at_price?: number | null;
          currency?: string;
          category_id?: string | null;
          category_name?: string | null;
          collection_id?: string | null;
          collection_name?: string | null;
          colors?: ProductColor[];
          sizes?: ProductSize[];
          material?: string | null;
          care?: string | null;
          inventory?: number;
          low_stock_threshold?: number;
          sku?: string | null;
          status?: ProductStatus;
          rating?: number;
          review_count?: number;
          is_new?: boolean;
          is_best_seller?: boolean;
          is_trending?: boolean;
          is_limited?: boolean;
          badges?: string[];
          tags?: string[];
          weight_grams?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
          Relationships: [];
      };
      product_images: {
        Row: {
          id: string;
          product_id: string;
          url: string;
          alt: string | null;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          url: string;
          alt?: string | null;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Insert"]>;
          Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          first_name: string | null;
          last_name: string | null;
          phone: string | null;
          accepts_marketing: boolean;
          tags: string[];
          notes: string | null;
          total_orders: number;
          total_spent: number;
          last_order_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          phone?: string | null;
          accepts_marketing?: boolean;
          tags?: string[];
          notes?: string | null;
          total_orders?: number;
          total_spent?: number;
          last_order_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["customers"]["Insert"]>;
          Relationships: [];
      };
      addresses: {
        Row: {
          id: string;
          customer_id: string;
          type: string;
          first_name: string | null;
          last_name: string | null;
          company: string | null;
          address1: string;
          address2: string | null;
          city: string;
          state: string | null;
          postal_code: string | null;
          country: string;
          phone: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          type?: string;
          first_name?: string | null;
          last_name?: string | null;
          company?: string | null;
          address1: string;
          address2?: string | null;
          city: string;
          state?: string | null;
          postal_code?: string | null;
          country: string;
          phone?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["addresses"]["Insert"]>;
          Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string | null;
          email: string;
          status: OrderStatus;
          payment_status: PaymentStatus;
          fulfillment_status: FulfillmentStatus;
          subtotal: number;
          discount_total: number;
          shipping_total: number;
          tax_total: number;
          total: number;
          currency: string;
          coupon_code: string | null;
          shipping_address: Json | null;
          billing_address: Json | null;
          shipping_method: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
          customer_note: string | null;
          staff_note: string | null;
          payment_intent_id: string | null;
          payment_method: string | null;
          placed_at: string;
          paid_at: string | null;
          fulfilled_at: string | null;
          shipped_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_number?: string;
          customer_id?: string | null;
          email: string;
          status?: OrderStatus;
          payment_status?: PaymentStatus;
          fulfillment_status?: FulfillmentStatus;
          subtotal?: number;
          discount_total?: number;
          shipping_total?: number;
          tax_total?: number;
          total: number;
          currency?: string;
          coupon_code?: string | null;
          shipping_address?: Json | null;
          billing_address?: Json | null;
          shipping_method?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          customer_note?: string | null;
          staff_note?: string | null;
          payment_intent_id?: string | null;
          payment_method?: string | null;
          placed_at?: string;
          paid_at?: string | null;
          fulfilled_at?: string | null;
          shipped_at?: string | null;
          delivered_at?: string | null;
          cancelled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
          Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_slug: string | null;
          product_image: string | null;
          variant_color: string | null;
          variant_size: string | null;
          sku: string | null;
          unit_price: number;
          quantity: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_slug?: string | null;
          product_image?: string | null;
          variant_color?: string | null;
          variant_size?: string | null;
          sku?: string | null;
          unit_price: number;
          quantity: number;
          total: number;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
          Relationships: [];
      };
      coupons: {
        Row: {
          id: string;
          code: string;
          description: string | null;
          type: CouponType;
          value: number;
          min_subtotal: number;
          max_uses: number | null;
          used_count: number;
          starts_at: string;
          ends_at: string | null;
          is_active: boolean;
          applies_to: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          description?: string | null;
          type: CouponType;
          value: number;
          min_subtotal?: number;
          max_uses?: number | null;
          used_count?: number;
          starts_at?: string;
          ends_at?: string | null;
          is_active?: boolean;
          applies_to?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["coupons"]["Insert"]>;
          Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          product_id: string;
          customer_id: string | null;
          author: string;
          rating: number;
          title: string | null;
          body: string | null;
          is_verified: boolean;
          is_published: boolean;
          helpful: number;
          response: string | null;
          response_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          customer_id?: string | null;
          author: string;
          rating: number;
          title?: string | null;
          body?: string | null;
          is_verified?: boolean;
          is_published?: boolean;
          helpful?: number;
          response?: string | null;
          response_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
          Relationships: [];
      };
      wishlists: {
        Row: {
          id: string;
          customer_id: string;
          product_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          product_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>;
          Relationships: [];
      };
      staff_profiles: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          full_name: string | null;
          role: Role;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          full_name?: string | null;
          role?: Role;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_profiles"]["Insert"]>;
          Relationships: [];
      };
      analytics_events: {
        Row: {
          id: number;
          event_type: string;
          entity_type: string | null;
          entity_id: string | null;
          customer_id: string | null;
          session_id: string | null;
          payload: Json;
          referrer: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          event_type: string;
          entity_type?: string | null;
          entity_id?: string | null;
          customer_id?: string | null;
          session_id?: string | null;
          payload?: Json;
          referrer?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["analytics_events"]["Insert"]>;
          Relationships: [];
      };
    };
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
