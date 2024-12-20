import { 
  integer, 
  varchar, 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  jsonb, 
  boolean 
} from "drizzle-orm/pg-core"

/**
 * Users table schema.
 */
export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  profileImage: text("profile_image"),
  name: varchar("name", { length: 255 }).notNull(),
  point: integer("point").notNull().default(0), // Points earned by the user
  score: integer("score").notNull().default(0), // Score earned by the user
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Reports table schema.
 */
export const Reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  location: text("location").notNull(),
  trashType: varchar("trash_type", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 255 }).notNull(),
  imageUrl: text("image_url"),
  verificationResult: jsonb("verification_result"),
  status: varchar("status", { length: 255 }).notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  collectorId: integer("collector_id").references(() => Users.id),
})

/**
 * Notifications table schema.
 */
export const Notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  message: text("message").notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})