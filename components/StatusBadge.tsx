import CollectionTask from "@/app/types/collectionTask"

interface StatusBadgeProps {
  status: CollectionTask['status']
}

/**
 * Displays a badge representing the status of a task.
 */
const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusConfig: Record<
    CollectionTask['status'],
    { color: string; label: string }
  > = {
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'รอดำเนินการ' },
    in_progress: { color: 'bg-blue-100 text-blue-800', label: 'กำลังดำเนินการ' },
    completed: { color: 'bg-green-100 text-green-800', label: 'เสร็จสิ้น' },
    verified: { color: 'bg-purple-100 text-purple-800', label: 'ตรวจสอบแล้ว' },
  }

  const { color, label } = statusConfig[status]

  return (
    <div className="w-36 flex justify-end">
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex w-fit items-center`}
      >
        {label}
      </span>
    </div>
  )
}

export default StatusBadge