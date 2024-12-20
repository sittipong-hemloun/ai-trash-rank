import CollectionTask from "@/app/types/collectionTask"
import { User } from "@/app/types/user"
import TaskCard from "./TaskCard"

interface TaskListProps {
  tasks: CollectionTask[]
  user: User | null
  onStartCollect: (taskId: number, newStatus: CollectionTask['status']) => void
  onVerify: (task: CollectionTask) => void
}

/**
 * Renders a list of trash collection tasks.
 */
const TaskList: React.FC<TaskListProps> = ({ tasks, user, onStartCollect, onVerify }) => (
  <div className="space-y-4">
    {tasks.map(task => (
      <TaskCard
        key={task.id}
        task={task}
        user={user}
        onStartCollect={onStartCollect}
        onVerify={onVerify}
      />
    ))}
  </div>
)

export default TaskList