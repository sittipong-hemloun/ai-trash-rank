/* eslint-disable @next/next/no-img-element */
'use client'

import { useState } from 'react'
import { Loader } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import {
  updateTaskStatus,
  updateUserPoints,
  updateUserScore,
  createNotification,
} from '@/utils/db/actions'
import { GoogleGenerativeAI } from "@google/generative-ai"
import CollectionTask from '../types/collectionTask'
import Pagination from '@/components/Pagination'
import TaskList from '@/components/TaskList'
import VerificationModal from '@/components/VerificationModal'
import useTasks from '@/hooks/useTasks'
import useUser from '@/hooks/useUser'
import VerificationResult from '../types/verificationResult'

// Make sure to set your Gemini API key in your environment variables
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

const ITEMS_PER_PAGE = 5

export default function CollectPage() {
  const { user, loading: userLoading } = useUser()
  const { tasks, setTasks, loading: tasksLoading } = useTasks()
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null)
  const [verificationImage, setVerificationImage] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'verifying' | 'success' | 'failure'
  >('idle')
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null)

  // Handle Task Status Change
  const handleStatusChange = async (
    taskId: number,
    newStatus: CollectionTask['status']
  ) => {
    if (!user) {
      toast.error('Please log in to collect trash.')
      return
    }

    try {
      const updatedTask = await updateTaskStatus(taskId, newStatus, user.id)
      if (updatedTask) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId
              ? { ...task, status: newStatus, collectorId: user.id }
              : task
          )
        )
        toast.success('Task status updated successfully')
      } else {
        toast.error('Failed to update task status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status. Please try again.')
    }
  }

  // Handle Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setVerificationImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Utility Functions
  const readFileAsBase64 = (dataUrl: string): string => dataUrl.split(',')[1]

  const extractJSON = (text: string): string => {
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return text.slice(jsonStart, jsonEnd + 1)
    }
    throw new Error('Invalid JSON format')
  }

  // Handle Verification Process
  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user) {
      toast.error('Missing required information for verification.')
      return
    }

    setVerificationStatus('verifying')

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey!)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      const base64Data = readFileAsBase64(verificationImage)

      const imageParts = [
        {
          inlineData: {
            data: base64Data,
            mimeType: 'image/jpeg',
          },
        },
      ]

      const prompt = `คุณเป็นผู้เชี่ยวชาญด้านการจัดการและการรีไซเคิลขยะ วิเคราะห์ภาพนี้และให้ข้อมูลดังนี้:
1. ยืนยันว่าประเภทของขยะ (ระบุเฉพาะประเภท เช่น พลาสติก, กระดาษ, แก้ว, โลหะ, อินทรีย์ โดยสามารถมีหลายประเภทได้) ตรงกับ: ${selectedTask.trashType}
2. ปริมาณหรือจำนวนโดยประมาณ format คือ (ตัวเลข + " " + กก.) เท่านั้น ห้ามใส่ข้อความอื่นๆ หรือข้อความที่ไม่เกี่ยวข้อง ใกล้เคียงกับ: ${selectedTask.amount}
3. ระดับความมั่นใจในการประเมินครั้งนี้ (แสดงเป็นเปอร์เซ็นต์)
ตอบกลับในรูปแบบ JSON เช่นนี้:
{
  "trashTypeMatch": true/false,
  "quantityMatch": true/false,
  "confidence": confidence level as a number between 0 and 1
}
ตัวอย่าง:
{
  "trashTypeMatch": true,
  "quantityMatch": true,
  "confidence": 0.9
}`

      const result = await model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = await response.text()

      // Parse and validate the AI response
      const parsedText = extractJSON(text)
      const parsedResult: VerificationResult = JSON.parse(parsedText)

      console.log('Parsed verification result:', parsedResult)
      setVerificationResult(parsedResult)
      setVerificationStatus('success')

      // Handle successful verification
      if (
        parsedResult.trashTypeMatch &&
        parsedResult.quantityMatch &&
        parsedResult.confidence > 0.7
      ) {
        await handleStatusChange(selectedTask.id, 'verified')

        const earnedPoints = 50
        const earnedScore = 20

        await updateUserPoints(user.id, earnedPoints)
        await updateUserScore(user.id, earnedScore)

        await createNotification(
          user.id,
          `Verification successful! You earned ${earnedPoints} points and ${earnedScore} score!`,
          'reward'
        )

        toast.success(
          `Verification successful! You earned ${earnedPoints} points and ${earnedScore} score!`,
          {
            duration: 5000,
            position: 'top-center',
          }
        )
      } else {
        toast.error(
          'Verification failed. The collected trash does not match the reported trash.',
          {
            duration: 5000,
            position: 'top-center',
          }
        )
      }
    } catch (error) {
      console.error('Error during verification:', error)
      setVerificationStatus('failure')
      toast.error('Verification failed. Please try again.', {
        duration: 5000,
        position: 'top-center',
      })
    }
  }

  // Filter and Paginate Tasks
  const filteredTasks = tasks.filter(task =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Combine Loading States
  const isLoading = userLoading || tasksLoading

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">รายงานการเก็บขยะ</h1>

      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="ค้นหาตามพื้นที่"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : (
        <>
          <TaskList
            tasks={paginatedTasks}
            user={user}
            onStartCollect={handleStatusChange}
            onVerify={setSelectedTask}
          />

          <Pagination
            currentPage={currentPage}
            totalPages={pageCount}
            onPrevious={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            onNext={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
          />
        </>
      )}

      {selectedTask && user && (
        <VerificationModal
          task={selectedTask}
          user={user}
          verificationImage={verificationImage}
          setVerificationImage={setVerificationImage}
          handleImageUpload={handleImageUpload}
          handleVerify={handleVerify}
          verificationStatus={verificationStatus}
          verificationResult={verificationResult}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  )
}