/**
 * Represents a user notification.
 */
interface NotificationType {
  id: number
  type: string
  message: string
  createdAt: Date
  userId: number
  isRead: boolean
}

export default NotificationType