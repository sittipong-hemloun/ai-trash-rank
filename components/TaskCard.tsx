/* eslint-disable @next/next/no-img-element */
import CollectionTask from "@/types/collectionTask";
import { User } from "@/types/user";
import StatusBadge from "./StatusBadge";
import { Calendar, MapPin, Trash2, Weight } from "lucide-react";
import { Button } from "./ui/button";

interface TaskCardProps {
  task: CollectionTask;
  user: User | null;
  onStartCollect: (taskId: number, newStatus: CollectionTask["status"]) => void;
  onVerify: (task: CollectionTask) => void;
}

/**
 * Displays individual trash collection task details.
 */
const TaskCard: React.FC<TaskCardProps> = ({ task, user, onStartCollect, onVerify }) => (
  <div className="bg-gray-200 p-4 rounded-lg shadow-sm border border-gray-200 max-w-lg mx-auto md:max-w-2xl lg:max-w-3xl">
    {/* Header */}
    <div className="flex justify-between items-start mb-2 md:flex-row flex-col">
      <h2 className="text-lg font-medium text-gray-800 flex items-center">
        <MapPin className="w-5 h-5 mr-2 text-gray-500" />
        {task.location}
      </h2>
      <StatusBadge status={task.status} />
    </div>

    {/* Details Section */}
    <div className="flex justify-between gap-2 text-sm text-gray-600 mb-3 flex-wrap md:flex-nowrap">
      <div className="flex items-center mb-2 md:mb-0">
        <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
        <span>{task.trashType}</span>
      </div>
      <div className="flex gap-5 flex-wrap md:flex-nowrap">
        <div className="flex items-center">
          <Weight className="w-4 h-4 mr-2 text-gray-500" />
          {task.quantity}
        </div>
        <div className="flex items-center">
          <Calendar className="w-4 h-4 mr-2 text-gray-500" />
          {task.date}
        </div>
      </div>
    </div>

    {/* Task Image */}
    <div className="flex items-center mb-4">
      <img
        src={task.imageUrl}
        alt="Trash"
        className="w-full h-80 object-cover rounded-md"
      />
    </div>

    {/* Action Buttons */}
    <div className="flex justify-end mt-3">
      {task.status === "pending" && task.userId !== user?.id && (
        <Button
          onClick={() => onStartCollect(task.id, "in_progress")}
          variant="outline"
          size="sm"
          className="w-full md:w-auto"
        >
          เริ่มเก็บขยะ
        </Button>
      )}
      {task.status === "in_progress" && task.collectorId === user?.id && (
        <Button
          onClick={() => onVerify(task)}
          variant="outline"
          size="sm"
          className="w-full md:w-auto"
        >
          เก็บเสร็จสิ้นและตรวจสอบ
        </Button>
      )}
      {task.status === "in_progress" && task.collectorId !== user?.id && (
        <span className="text-yellow-600 text-sm font-medium">
          คนอื่นกำลังดำเนินการ
        </span>
      )}
      {task.status === "verified" && (
        <span className="text-green-600 text-sm font-medium">
          จัดเก็บแล้ว
        </span>
      )}
    </div>
  </div>
);

export default TaskCard;