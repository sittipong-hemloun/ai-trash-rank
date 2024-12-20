/**
 * Represents a trash collection task.
 */
interface CollectionTask {
  id: number
  location: string
  trashType: string
  amount: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  date: string
  collectorId: number | null
  imageUrl: string
}

export default CollectionTask