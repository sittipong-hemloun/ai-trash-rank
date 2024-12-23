import { db } from './dbConfig'
import { Users, Reports, Notifications } from './schema'
import { eq, sql, and, desc } from 'drizzle-orm'

/**
 * Creates a new user in the database.
 * @param email - User's email.
 * @param profileImage - URL to the user's profile image.
 * @param name - User's name.
 * @returns The created user or null if an error occurs.
 */
export async function createUser(email: string, profileImage: string, name: string) {
  try {
    const [user] = await db.insert(Users).values({ email, profileImage, name }).returning().execute()
    return user
  } catch (error) {
    console.error("Error creating user:", error)
    return null
  }
}

/**
 * Retrieves a user by their email.
 * @param email - User's email.
 * @returns The user or null if not found.
 */
export async function getUserByEmail(email: string) {
  try {
    const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute()
    return user
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return null
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
        point: sql`${Users.point} + ${pointsToAdd}`
      })
      .where(eq(Users.id, userId))
      .returning()
      .execute()
    return updatedUser
  } catch (error) {
    console.error("Error updating user points:", error)
    return null
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
      .execute()
    return updatedUser
  } catch (error) {
    console.error("Error updating user score:", error)
    return null
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
 * @returns The created report or null if an error occurs.
 */
export async function createReport(
  userId: number,
  location: string,
  trashType: string,
  quantity: string,
  imageUrl?: string,
  verificationResult?: unknown
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
      })
      .returning()
      .execute()

    // Award points for reporting trash
    const pointsEarned = 10
    await updateUserPoints(userId, pointsEarned)

    // Create a notification for the user
    await createNotification(
      userId,
      `คุณได้รับ ${pointsEarned} คะแนนจากการรายงานขยะ`,
      'reward'
    )

    return report
  } catch (error) {
    console.error("Error creating report:", error)
    return null
  }
}

/**
 * Retrieves reports by user ID.
 * @param userId - The ID of the user.
 * @returns An array of reports or an empty array if an error occurs.
 */
export async function getReportsByUserId(userId: number) {
  try {
    const reports = await db.select().from(Reports).where(eq(Reports.userId, userId)).execute()
    return reports
  } catch (error) {
    console.error("Error fetching reports:", error)
    return []
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
        location: Reports.location,
        trashType: Reports.trashType,
        quantity: Reports.quantity,
        status: Reports.status,
        date: Reports.createdAt,
        collectorId: Reports.collectorId,
        imageUrl: Reports.imageUrl,
      })
      .from(Reports)
      .limit(limit)
      .execute()

    return tasks.map(task => ({
      ...task,
      date: task.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }))
  } catch (error) {
    console.error("Error fetching trash collection tasks:", error)
    return []
  }
}

/**
 * Updates the status of a trash collection task.
 * @param reportId - The ID of the report/task.
 * @param newStatus - The new status to set.
 * @param collectorId - The ID of the collector (optional).
 * @returns The updated report or throws an error if the update fails.
 */
export async function updateTaskStatus(reportId: number, newStatus: string, collectorId?: number) {
  try {
    const updateData: { status: string; collectorId?: number } = { status: newStatus }
    if (collectorId !== undefined) {
      updateData.collectorId = collectorId
    }
    const [updatedReport] = await db
      .update(Reports)
      .set(updateData)
      .where(eq(Reports.id, reportId))
      .returning()
      .execute()
    return updatedReport
  } catch (error) {
    console.error("Error updating task status:", error)
    throw error
  }
}

/**
 * Creates a new notification for a user.
 * @param userId - The ID of the user.
 * @param message - The notification message.
 * @param type - The type of notification.
 * @returns The created notification or null if an error occurs.
 */
export async function createNotification(userId: number, message: string, type: string) {
  try {
    const [notification] = await db
      .insert(Notifications)
      .values({ userId, message, type })
      .returning()
      .execute()
    return notification
  } catch (error) {
    console.error("Error creating notification:", error)
    return null
  }
}

/**
 * Retrieves unread notifications for a user.
 * @param userId - The ID of the user.
 * @returns An array of unread notifications or an empty array if an error occurs.
 */
export async function getUnreadNotifications(userId: number) {
  try {
    return await db.select().from(Notifications).where(
      and(
        eq(Notifications.userId, userId),
        eq(Notifications.isRead, false)
      )
    ).execute()
  } catch (error) {
    console.error("Error fetching unread notifications:", error)
    return []
  }
}

/**
 * Marks a notification as read.
 * @param notificationId - The ID of the notification to mark as read.
 */
export async function markNotificationAsRead(notificationId: number) {
  try {
    await db.update(Notifications).set({ isRead: true }).where(eq(Notifications.id, notificationId)).execute()
  } catch (error) {
    console.error("Error marking notification as read:", error)
  }
}