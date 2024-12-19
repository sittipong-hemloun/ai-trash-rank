import { db } from './dbConfig';
import { Users, Reports, Notifications } from './schema';
import { eq, sql, and, desc } from 'drizzle-orm';

export async function createUser(email: string, profileImage: string, name: string) {
  try {
    const [user] = await db.insert(Users).values({ email, profileImage, name }).returning().execute();
    return user;
  } catch (error) {
    console.error("Error creating user:", error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    const [user] = await db.select().from(Users).where(eq(Users.email, email)).execute();
    return user;
  } catch (error) {
    console.error("Error fetching user by email:", error);
    return null;
  }
}

export async function updateUserPoints(userId: number, pointsToAdd: number) {
  try {
    const [updatedUser] = await db
      .update(Users)
      .set({ 
        point: sql`${Users.point} + ${pointsToAdd}`
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

// Report-related functions

export async function createReport(
  userId: number,
  location: string,
  trashType: string,
  amount: string,
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
        amount,
        imageUrl,
        verificationResult,
        status: "pending",
      })
      .returning()
      .execute();

    // Award points for reporting trash
    const pointsEarned = 10;
    await updateUserPoints(userId, pointsEarned);

    // Create a notification for the user
    await createNotification(
      userId,
      `You've earned ${pointsEarned} points for reporting trash!`,
      'reward'
    );

    return report;
  } catch (error) {
    console.error("Error creating report:", error);
    return null;
  }
}

export async function getReportsByUserId(userId: number) {
  try {
    const reports = await db.select().from(Reports).where(eq(Reports.userId, userId)).execute();
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

export async function getTrashCollectionTasks(limit: number = 20) {
  try {
    const tasks = await db
      .select({
        id: Reports.id,
        location: Reports.location,
        trashType: Reports.trashType,
        amount: Reports.amount,
        status: Reports.status,
        date: Reports.createdAt,
        collectorId: Reports.collectorId,
        imageUrl: Reports.imageUrl,
      })
      .from(Reports)
      .limit(limit)
      .execute();

    return tasks.map(task => ({
      ...task,
      date: task.date.toISOString().split('T')[0], // Format date as YYYY-MM-DD
    }));
  } catch (error) {
    console.error("Error fetching trash collection tasks:", error);
    return [];
  }
}

export async function updateTaskStatus(reportId: number, newStatus: string, collectorId?: number) {
  try {
    const updateData: { status: string; collectorId?: number } = { status: newStatus };
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

// Notification functions
export async function createNotification(userId: number, message: string, type: string) {
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

export async function getUnreadNotifications(userId: number) {
  try {
    return await db.select().from(Notifications).where(
      and(
        eq(Notifications.userId, userId),
        eq(Notifications.isRead, false)
      )
    ).execute();
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId: number) {
  try {
    await db.update(Notifications).set({ isRead: true }).where(eq(Notifications.id, notificationId)).execute();
  } catch (error) {
    console.error("Error marking notification as read:", error);
  }
}