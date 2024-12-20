import CollectionTask from "@/app/types/collectionTask"
import { getTrashCollectionTasks } from "@/utils/db/actions"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

/**
 * Custom hook to fetch and manage trash collection tasks.
 */
const useTasks = () => {
  const [tasks, setTasks] = useState<CollectionTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getTrashCollectionTasks()
        setTasks(fetchedTasks as CollectionTask[])
      } catch (error) {
        console.error('Error fetching tasks:', error)
        toast.error('Failed to load tasks. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [])

  return { tasks, setTasks, loading }
}

export default useTasks