import { relations } from "drizzle-orm";
import { categories, collections, productImages, products, reviews } from "./catalog";
import {
  addresses,
  coupons,
  customers,
  orderItems,
  orders,
  returns,
  wishlists,
} from "./commerce";
import { oauthAccounts, sessions, staffProfiles, users } from "./auth";
import { analyticsEvents } from "./analytics";

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  parent: one(categories, { fields: [categories.parentId], references: [categories.id] }),
}));

export const collectionsRelations = relations(collections, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  collection: one(collections, { fields: [products.collectionId], references: [collections.id] }),
  images: many(productImages),
  reviews: many(reviews),
  orderItems: many(orderItems),
  wishlistedBy: many(wishlists),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
  product: one(products, { fields: [reviews.productId], references: [products.id] }),
  customer: one(customers, { fields: [reviews.customerId], references: [customers.id] }),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  oauthAccounts: many(oauthAccounts),
  customer: one(customers, { fields: [users.id], references: [customers.userId] }),
  staffProfile: one(staffProfiles, { fields: [users.id], references: [staffProfiles.userId] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const oauthAccountsRelations = relations(oauthAccounts, ({ one }) => ({
  user: one(users, { fields: [oauthAccounts.userId], references: [users.id] }),
}));

export const staffProfilesRelations = relations(staffProfiles, ({ one }) => ({
  user: one(users, { fields: [staffProfiles.userId], references: [users.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  user: one(users, { fields: [customers.userId], references: [users.id] }),
  addresses: many(addresses),
  orders: many(orders),
  wishlist: many(wishlists),
  reviews: many(reviews),
  returns: many(returns),
  analyticsEvents: many(analyticsEvents),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
  customer: one(customers, { fields: [addresses.customerId], references: [customers.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  returns: many(returns),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  customer: one(customers, { fields: [wishlists.customerId], references: [customers.id] }),
  product: one(products, { fields: [wishlists.productId], references: [products.id] }),
}));

export const returnsRelations = relations(returns, ({ one }) => ({
  order: one(orders, { fields: [returns.orderId], references: [orders.id] }),
  customer: one(customers, { fields: [returns.customerId], references: [customers.id] }),
}));

export const couponsRelations = relations(coupons, () => ({}));

export const analyticsEventsRelations = relations(analyticsEvents, ({ one }) => ({
  customer: one(customers, { fields: [analyticsEvents.customerId], references: [customers.id] }),
}));
