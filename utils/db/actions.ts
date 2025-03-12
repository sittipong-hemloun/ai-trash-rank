import { db } from './dbConfig'
import { Users, Reports, Notifications, Posts, Activities, Rewards, Bins, UserRewards, ActivityImages } from "./schema";
import { eq, sql, and, desc } from "drizzle-orm";

/**
 * Creates a new user in the database.
 * @param email - User's email.
 * @param profileImage - URL to the user's profile image.
 * @param name - User's name.
 * @returns The created user or null if an error occurs.
 */
export async function createUser(
  email: string,
  profileImage: string,
  name: string
) {
  try {
    const [user] = await db
      .insert(Users)
      .values({ email, profileImage, name })
      .returning()
      .execute();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

/**
 * Retrieves a user by their email.
 * @param email - User's email.
 * @returns The user or null if not found.
 */
export async function getUserByEmail(email: string) {
  try {
    const [user] = await db
      .select()
      .from(Users)
      .where(eq(Users.email, email))
      .execute();
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

/**
 * Updates user's info: name, phoneNumber, and profileImage (all optional).
 */
export async function updateUserInfo(
  userId: number,
  name?: string,
  phoneNumber?: string,
  profileImage?: string
) {
  try {
    const [updatedUser] = await db
      .update(Users)
      .set({
        ...(name ? { name } : {}),
        ...(phoneNumber ? { phoneNumber } : {}),
        ...(profileImage ? { profileImage } : {}),
      })
      .where(eq(Users.id, userId))
      .returning()
      .execute();

    return updatedUser;
  } catch (error) {
    console.error("Error updating user info:", error);
    return null;
  }
}

// get all users
export async function getAllUsers() {
  try {
    const users = await db.select().from(Users).execute();
    return users;
  } catch (error) {
    console.error("Error fetching all users:", error);
    return [];
  }
}

/**
 * Updates a user's points by adding the specified quantity.
 * @param userId - The ID of the user.
 * @param pointsToAdd - The number of points to add.
 * @returns The updated user or null if an error occurs.
 */
export async function updateUserPoints(userId: number, pointsToAdd: number) {
  try {
    const [updatedUser] = await db
      .update(Users)
      .set({
        point: sql`${Users.point} + ${pointsToAdd}`,
      })
      .where(eq(Users.id, userId))
      .returning()
      .execute();
    return updatedUser;
  } catch (error) {
    console.error("Error updating user points:", error);
    return null;
  }
}

/**
 * Updates a user's score by adding the specified quantity.
 * @param userId - The ID of the user.
 * @param scoreToAdd - The number of score points to add.
 * @returns The updated user or null if an error occurs.
 */
export async function updateUserScore(userId: number, scoreToAdd: number) {
  try {
    const [updatedUser] = await db
      .update(Users)
      .set({
        score: sql`${Users.score} + ${scoreToAdd}`,
      })
      .where(eq(Users.id, userId))
      .returning()
      .execute();
    return updatedUser;
  } catch (error) {
    console.error("Error updating user score:", error);
    return null;
  }
}

/**
 * Creates a new trash report.
 * @param userId - The ID of the user creating the report.
 * @param location - Location of the trash.
 * @param trashType - Type of the trash.
 * @param quantity - Amount of the trash.
 * @param imageUrl - URL to the trash image.
 * @param verificationResult - Result of the trash verification.
 * @param coordinates - Coordinates in JSON string format.
 * @returns The created report or null if an error occurs.
 */
export async function createReport(
  userId: number,
  location: string,
  trashType: string,
  quantity: string,
  imageUrl?: string,
  verificationResult?: unknown,
  coordinates?: string
) {
  try {
    const [report] = await db
      .insert(Reports)
      .values({
        userId,
        location,
        trashType,
        quantity,
        imageUrl,
        verificationResult,
        status: "pending",
        coordinates,
      })
      .returning()
      .execute();

    // Award points for reporting trash
    const pointsEarned = 10;
    await updateUserPoints(userId, pointsEarned);

    // Create a notification for the user
    await createNotification(
      userId,
      `คุณได้รับ ${pointsEarned} คะแนนจากการรายงานขยะ`,
      "รางวัล"
    );

    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null;
  }
}

/**
 * Retrieves reports by user ID.
 * @param userId - The ID of the user.
 * @returns An array of reports or an empty array if an error occurs.
 */
export async function getReportsByUserId(userId: number) {
  try {
    const reports = await db
      .select()
      .from(Reports)
      .where(eq(Reports.userId, userId))
      .execute();
    return reports;
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function getRecentReports(limit: number = 10) {
  try {
    const reports = await db
      .select()
      .from(Reports)
      .orderBy(desc(Reports.createdAt))
      .limit(limit)
      .execute();
    return reports;
  } catch (error) {
    console.error("Error fetching recent reports:", error);
    return [];
  }
}

/**
 * Retrieves recent trash collection tasks.
 * @param limit - The maximum number of tasks to retrieve.
 * @returns An array of tasks or an empty array if an error occurs.
 */
export async function getTrashCollectionTasks(limit: number = 20) {
  try {
    const tasks = await db
      .select({
        id: Reports.id,
        userId: Reports.userId, // Include the reporter's ID
        location: Reports.location,
        trashType: Reports.trashType,
        quantity: Reports.quantity,
        status: Reports.status,
        date: Reports.createdAt,
        collectorId: Reports.collectorId,
        imageUrl: Reports.imageUrl,
        coordinates: Reports.coordinates,
      })
      .from(Reports)
      .limit(limit)
      .orderBy(desc(Reports.createdAt))
      .execute();

    return tasks.map((task) => ({
      ...task,
      date: task.date.toISOString().split("T")[0], // Format date as YYYY-MM-DD
    }));
  } catch (error) {
    console.error("Error fetching trash collection tasks:", error);
    return [];
  }
}

/**
 * Updates the status of a trash collection task.
 * @param reportId - The ID of the report/task.
 * @param newStatus - The new status to set.
 * @param collectorId - The ID of the collector (optional).
 * @returns The updated report or throws an error if the update fails.
 */
export async function updateTaskStatus(
  reportId: number,
  newStatus: string,
  collectorId?: number
) {
  try {
    const updateData: { status: string; collectorId?: number } = {
      status: newStatus,
    };
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId;
    }
    const [updatedReport] = await db
      .update(Reports)
      .set(updateData)
      .where(eq(Reports.id, reportId))
      .returning()
      .execute();
    return updatedReport;
  } catch (error) {
    console.error("Error updating task status:", error);
    throw error;
  }
}

/**
 * Creates a new notification for a user.
 * @param userId - The ID of the user.
 * @param message - The notification message.
 * @param type - The type of notification.
 * @returns The created notification or null if an error occurs.
 */
export async function createNotification(
  userId: number,
  message: string,
  type: string
) {
  try {
    const [notification] = await db
      .insert(Notifications)
      .values({ userId, message, type })
      .returning()
      .execute();
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
}

/**
 * Retrieves unread notifications for a user.
 * @param userId - The ID of the user.
 * @returns An array of unread notifications or an empty array if an error occurs.
 */
export async function getUnreadNotifications(userId: number) {
  try {
    return await db
      .select()
      .from(Notifications)
      .where(
        and(eq(Notifications.userId, userId), eq(Notifications.isRead, false))
      )
      .execute();
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }
}

/**
 * Marks a notification as read.
 * @param notificationId - The ID of the notification to mark as read.
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    await db
      .update(Notifications)
      .set({ isRead: true })
      .where(eq(Notifications.id, notificationId))
      .execute();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}

/**
 * Creates a new bin in the database.
 * @param location - Location of the bin.
 * @param coordinates - Coordinates of the bin.
 * @param status - Status of the bin.
 * @returns The created bin or null if an error occurs.
 */
export async function createBin(userId: number, location: string, coordinates: string, status: 'active' | 'inactive', type: string) {
  try {
    const [bin] = await db.insert(Bins).values({ userId, location, coordinates, status, type }).returning().execute()
    return bin
  } catch (error) {
    console.error("Error creating bin:", error)
    return null
  }
}

/**
 * Retrieves all bins from the database.
 * @returns An array of bins or an empty array if an error occurs.
 */
export async function getAllBins() {
  try {
    const bins = await db.select().from(Bins).execute()
    return bins
  } catch (error) {
    console.error("Error fetching bins:", error)
    return []
  }
}

export async function getAllPosts() {
  try {
    const posts = await db
      .select()
      .from(Posts)
      .orderBy(desc(Posts.createdAt))
      .execute();
    return posts;
  } catch (error) {
    console.error("Error fetching all posts:", error);
    return [];
  }
}

/**
 * Retrieves all activities from the database.
 */
export async function getAllActivities() {
  try {
    const activities = await db
      .select()
      .from(Activities)
      .orderBy(desc(Activities.createdAt))
      .execute();
    return activities;
  } catch (error) {
    console.error("Error fetching all activities:", error);
    return [];
  }
}

export async function createPosts(
  userId: number,
  name: string,
  content: string,
  image?: string
) {
  try {
    const [post] = await db
      .insert(Posts)
      .values({
        userId,
        name,
        content,
        image,
      })
      .returning()
      .execute();
    return post;
  } catch (error) {
    console.error("Error create post fail:", error);
    return [];
  }
}

/**
 * Insert multiple images for an activity. Called once the activity row is created.
 */
export async function createActivityImage(activityId: number, url: string) {
  try {
    const [activityImage] = await db
      .insert(ActivityImages)
      .values({
        activityId,
        url
      })
      .returning()
      .execute();
    return activityImage;
  } catch (error) {
    console.error("Error creating activity image:", error);
    return null;
  }
}

/**
 * Retrieves all images for a given activityId
 */
export async function getActivityImagesByActivityId(activityId: number) {
  try {
    const images = await db
      .select()
      .from(ActivityImages)
      .where(eq(ActivityImages.activityId, activityId))
      .orderBy(desc(ActivityImages.createdAt))
      .execute();
    return images;
  } catch (error) {
    console.error("Error fetching activity images:", error);
    return [];
  }
}

export async function createActivities(
  userId: number,
  name: string,
  content: string,
  startDate: Date,
  endDate: Date,
  image?: string,
  images?: string[]
) {
  try {
    const [activity] = await db
      .insert(Activities)
      .values({
        userId,
        name,
        content,
        startDate,
        endDate,
        image,
      })
      .returning()
      .execute();

    // If we have multiple images, insert them
    if (images && images.length > 0) {
      for (const img of images) {
        await createActivityImage(activity.id, img);
      }
    }

    return activity;
  } catch (error) {
    console.error("Error create activity fail:", error);
    return [];
  }
}

export async function getActivityById(activityId: number) {
  try {
    const [activity] = await db
      .select()
      .from(Activities)
      .where(eq(Activities.id, activityId))
      .execute();
    return activity;
  } catch (error) {
    console.error("Error fetching activity by ID:", error);
    return null;
  }
}

export async function getPostById(postId: number) {
  try {
    const [post] = await db
      .select()
      .from(Posts)
      .where(eq(Posts.id, postId))
      .execute();
    return post;
  } catch (error) {
    console.error("Error fetching post by ID:", error);
    return null;
  }
}

export async function getRewardsByActivityId(activityId: number) {
  try {
    const rewards = await db
      .select()
      .from(Rewards)
      .where(eq(Rewards.activityId, activityId))
      .execute();
    return rewards;
  } catch (error) {
    console.error("Error fetching rewards by activity id:", error);
    return [];
  }
}

export async function createReward(
  activityId: number,
  name: string,
  redeemPoint: number,
  amount: number
) {
  try {
    const [reward] = await db
      .insert(Rewards)
      .values({
        activityId,
        name,
        redeemPoint,
        amount,
      })
      .returning()
      .execute();
    return reward;
  } catch (error) {
    console.error("Error creating reward:", error);
    return null;
  }
}

export async function decrementRewardAmount(rewardId: number) {
  try {
    const [updatedReward] = await db
      .update(Rewards)
      .set({
        amount: sql`${Rewards.amount} - 1`,
      })
      .where(and(eq(Rewards.id, rewardId), sql`${Rewards.amount} > 0`))
      .returning()
      .execute();
    return updatedReward;
  } catch (error) {
    console.error("Error decrementing reward amount:", error);
    return null;
  }
}

export async function createUserReward(userId: number, rewardId: number) {
  try {
    const [userReward] = await db.insert(UserRewards)
      .values({ userId, rewardId })
      .returning()
      .execute();
    return userReward;
  } catch (error) {
    console.error("Error creating user reward:", error);
    return null;
  }
}

export async function getUserRewards(userId: number) {
  try {
    const rewards = await db
      .select({
        redeemedAt: UserRewards.redeemedAt,
        rewardId: Rewards.id,
        name: Rewards.name,
        redeemPoint: Rewards.redeemPoint,
      })
      .from(UserRewards)
      .innerJoin(Rewards, eq(Rewards.id, UserRewards.rewardId))
      .where(eq(UserRewards.userId, userId))
      .execute();
    return rewards;
  } catch (error) {
    console.error("Error fetching user rewards:", error);
    return [];
  }
}

/**
 * ลบกิจกรรม (activity) โดยใช้ activityId
 */
export async function deleteActivity(activityId: number) {
  try {
    // ลบ rewards ที่เกี่ยวข้องกับ activity นี้ก่อน
    await db.delete(Rewards).where(eq(Rewards.activityId, activityId)).execute();
    // ลบ activity_images ที่เกี่ยวข้อง
    await db.delete(ActivityImages).where(eq(ActivityImages.activityId, activityId)).execute();
    // จากนั้นลบ activity
    await db.delete(Activities).where(eq(Activities.id, activityId)).execute();
    return true;
  } catch (error) {
    console.error("Error deleting activity:", error);
    return false;
  }
}

/**
 * ลบโพสต์ (post) โดยใช้ postId
 */
export async function deletePost(postId: number) {
  try {
    await db.delete(Posts).where(eq(Posts.id, postId)).execute();
    return true;
  } catch (error) {
    console.error("Error deleting post:", error);
    return false;
  }
}

/**
 * อัปเดตโพสต์ด้วย id ที่กำหนด
 */
export async function updatePost(
  postId: number,
  name: string,
  content: string,
  image?: string
) {
  try {
    const [updatedPost] = await db
      .update(Posts)
      .set({
        name,
        content,
        ...(image ? { image } : {}),
      })
      .where(eq(Posts.id, postId))
      .returning()
      .execute();
    return updatedPost;
  } catch (error) {
    console.error("Error updating post:", error);
    return null;
  }
}

/**
 * อัปเดตกิจกรรมด้วย id ที่กำหนด
 */
export async function updateActivity(
  activityId: number,
  name: string,
  content: string,
  startDate: string,
  endDate: string,
  image?: string
) {
  try {
    const [updatedActivity] = await db
      .update(Activities)
      .set({
        name,
        content,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        ...(image ? { image } : {}),
      })
      .where(eq(Activities.id, activityId))
      .returning()
      .execute();
    return updatedActivity;
  } catch (error) {
    console.error("Error updating activity:", error);
    return null;
  }
}

/**
 * ลบของรางวัลทั้งหมดที่เกี่ยวข้องกับกิจกรรมที่มี activityId ที่กำหนด
 */
export async function deleteRewardsByActivityId(activityId: number) {
  try {
    await db
      .delete(Rewards)
      .where(eq(Rewards.activityId, activityId))
      .execute();
    return true;
  } catch (error) {
    console.error("Error deleting rewards for activity:", error);
    return false;
  }
}

export async function getActivityRedemptions(activityId: number) {
  try {
    const redemptions = await db
      .select({
        redeemedAt: UserRewards.redeemedAt,
        rewardName: Rewards.name,
        userName: Users.name,
        userEmail: Users.email,
        userPhone: Users.phoneNumber,
      })
      .from(UserRewards)
      .innerJoin(Rewards, eq(Rewards.id, UserRewards.rewardId))
      .innerJoin(Users, eq(Users.id, UserRewards.userId))
      .where(eq(Rewards.activityId, activityId))
      .orderBy(desc(UserRewards.redeemedAt))
      .execute();
    return redemptions;
  } catch (error) {
    console.error("Error fetching activity redemptions:", error);
    return [];
  }
}