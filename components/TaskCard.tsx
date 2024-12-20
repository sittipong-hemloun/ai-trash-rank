/* eslint-disable @next/next/no-img-element */
import CollectionTask from "@/app/types/collectionTask"
import { User } from "@/app/types/user"
import StatusBadge from "./StatusBadge"
import { Calendar, MapPin, Trash2, Weight } from "lucide-react"
import { Button } from "./ui/button"

interface TaskCardProps {
  task: CollectionTask
  user: User | null
  onStartCollect: (taskId: number, newStatus: CollectionTask['status']) => void
  onVerify: (task: CollectionTask) => void
}

const TaskCard: React.FC<TaskCardProps> = ({ task, user, onStartCollect, onVerify }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
    <div className="flex justify-between items-start mb-2">
      <h2 className="text-lg font-medium text-gray-800 flex items-center">
        <MapPin className="w-5 h-5 mr-2 text-gray-500" />
        {task.location}
      </h2>
      <StatusBadge status={task.status} />
    </div>
    <div className="flex justify-between gap-2 text-sm text-gray-600 mb-3">
      <div className="flex items-center">
        <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
        <span>{task.trashType}</span>
      </div>
      <div className="flex gap-5">
        <div className="flex items-center">
          <Weight className="w-4 h-4 mr-2 text-gray-500" />
          {task.amount}
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          {task.date}
        </div>
      </div>
    </div>
    {/* Task Image */}
    <div className="flex items-center">
      <img
        src={task.imageUrl}
        alt="Trash"
        className="w-full h-80 object-cover rounded-md"
      />
    </div>
    <div className="flex justify-end mt-3">
      {task.status === 'pending' && (
        <Button
          onClick={() => onStartCollect(task.id, 'in_progress')}
          variant="outline"
          size="sm"
        >
          เริ่มเก็บขยะ
        </Button>
      )}
      {task.status === 'in_progress' && task.collectorId === user?.id && (
        <Button
          onClick={() => onVerify(task)}
          variant="outline"
          size="sm"
        >
          เก็บเสร็จสิ้นและตรวจสอบ
        </Button>
      )}
      {task.status === 'in_progress' && task.collectorId !== user?.id && (
        <span className="text-yellow-600 text-sm font-medium">
          คนอื่นกำลังดำเนินการ
        </span>
      )}
      {task.status === 'verified' && (
        <span className="text-green-600 text-sm font-medium">
          จัดเก็บแล้ว
        </span>
      )}
    </div>
  </div>
)

export default TaskCard