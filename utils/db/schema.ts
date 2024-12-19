import { integer, varchar, pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";

// Users table
export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  profileImage: text("profile_image"),
  name: varchar("name", { length: 255 }).notNull(),
  point: integer("point").notNull().default(0), // New field for points
  score: integer("score").notNull().default(0), // New field for score
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reports table
export const Reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  location: text("location").notNull(),
  wasteType: varchar("waste_type", { length: 255 }).notNull(),
  amount: varchar("amount", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  verificationResult: jsonb("verification_result"),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  collectorId: integer("collector_id").references(() => Users.id),
});

// CollectedWastes table
export const CollectedWastes = pgTable("collected_wastes", {
  id: serial("id").primaryKey(),
  reportId: integer("report_id").references(() => Reports.id).notNull(),
  collectorId: integer("collector_id").references(() => Users.id).notNull(),
  collectionDate: timestamp("collection_date").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("collected"),
});

// Notifications table
export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});