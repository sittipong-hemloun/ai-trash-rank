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
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * NEW: UserRoles table schema for multi-role support.
 * A user can hold multiple roles, e.g. normal, coperate, admin.
 */
export const UserRoles = pgTable("user_roles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  role: varchar("role", { length: 50 }).notNull(),  // e.g. "normal", "coperate", "admin"
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Posts table schema.
 * Represents general posts such as news.
 */
export const Posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userProfileImage: text("user_profile_image"),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  image: text("image"), // URL or path to the featured image
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Activities table schema.
 * Represents activities that include rewards and have specific time frames.
 */
export const Activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userProfileImage: text("user_profile_image"),
  name: varchar("name", { length: 255 }).notNull(),
  content: text("content").notNull(),
  image: text("image"), // Single/featured image if needed
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Table to store multiple images for each activity.
 */
export const ActivityImages = pgTable("activity_images", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => Activities.id).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Table to store additional images for posts.
 */
export const PostImages = pgTable("post_images", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").references(() => Posts.id).notNull(),
  url: text("url").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Rewards table schema.
 * Now references Activities instead of Posts.
 */
export const Rewards = pgTable("rewards", {
  id: serial("id").primaryKey(),
  activityId: integer("activity_id").references(() => Activities.id).notNull(),
  amount: integer("amount").notNull().default(0),
  name: varchar("name", { length: 255 }).notNull(),
  redeemPoint: integer("redeem_point").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Join table for Users and Rewards (Many-to-Many relationship).
 */
export const UserRewards = pgTable("user_rewards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  rewardId: integer("reward_id").references(() => Rewards.id).notNull(),
  redeemedAt: timestamp("redeemed_at").defaultNow().notNull(),
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
  coordinates: text("coordinates"),
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

/**
 * Bin table schema for Google Maps.
 */
export const Bins = pgTable("bins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  location: text("location").notNull(),
  coordinates: text("coordinates").notNull(), // Latitude and Longitude
  type: varchar("type", { length: 50 }).notNull(), // Type of bin
  status: varchar("status", { length: 50 }).notNull().default("active"), // Status of the bin
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Likes table schema.
 * Supports likes for posts and activities.
 */
export const Likes = pgTable("likes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  targetType: varchar("target_type", { length: 50 }).notNull(), // 'post' or 'activity'
  targetId: integer("target_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * Comments table schema.
 * Supports comments for posts and activities.
 */
export const Comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  userName: varchar("user_name", { length: 255 }).notNull(),
  userProfileImage: text("user_profile_image"),
  targetType: varchar("target_type", { length: 50 }).notNull(), // 'post' or 'activity'
  targetId: integer("target_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

/**
 * NEW: CoperateRegistrations table
 * Stores pending requests for coperate registration.
 */
export const CoperateRegistrations = pgTable("coperate_registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => Users.id).notNull(),
  orgName: text("org_name"),
  orgType: text("org_type"),
  orgDetail: text("org_detail"),
  orgImage: text("org_image"),
  status: varchar("status", { length: 50 }).notNull().default("pending"), // pending, approved, rejected, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
})