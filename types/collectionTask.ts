/**
 * Represents a trash collection task.
 */
interface CollectionTask {
  id: number;
  userId: number; // The ID of the user who reported the trash
  location: string;
  trashType: string;
  quantity: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  date: string;
  collectorId: number | null;
  imageUrl: string;
  coordinates: string;
}

export default CollectionTask;