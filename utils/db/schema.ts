import { 
  integer, 
  varchar, 
  pgTable, 
  serial, 
  text, 
  timestamp, 
  jsonb, 
  boolean,
} from "drizzle-orm/pg-core"

/**
 * Users table schema.
 */
export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  profileImage: text("profile_image"),
  name: varchar("name", { length: 255 }).notNull(),
  point: integer("point").notNull().default(0),
  score: integer("score").notNull().default(0),
  phoneNumber: varchar("phone_number", { length: 10 }),
  // phoneNumber: varchar("phone_number", { length: 10 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Posts table schema.
 * Represents general posts such as news.
 */
export const Posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  image: text("image"), // URL or path to the image
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Activities table schema.
 * Represents activities that include rewards and have specific time frames.
 */
export const Activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  image: text("image"), // URL or path to the image
  rewardCount: integer("reward_count").notNull().default(0),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Rewards table schema.
 * Now references Activities instead of Posts.
 */
export const Rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => Activities.id).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  qrCode: text("qr_code").notNull(), // QR code image URL or data
  redeemPoint: integer("redeem_point").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Join table for Users and Rewards (Many-to-Many relationship).
 */
export const UserRewards = pgTable("user_rewards", {
  userId: integer("user_id").references(() => Users.id).notNull(),
  rewardId: integer("reward_id").references(() => Rewards.id).notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
}, (table) => ({
  primaryKey: [table.userId, table.rewardId],
}))

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
