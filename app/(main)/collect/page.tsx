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
import CollectionTask from '../../../types/collectionTask'
import Pagination from '@/components/Pagination'
import TaskList from '@/components/TaskList'
import VerificationModal from '@/components/VerificationModal'
import useTasks from '@/hooks/useTasks'
import useUser from '@/hooks/useUser'
import TaskGoogleMap from '@/components/TaskGoogleMap'

// NOTE: You can define a more specific interface for the new verification result.
export interface CollectVerificationResult {
  trashIsCollected: boolean
  confidence: number
}

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
  const [verificationResult, setVerificationResult] = useState<CollectVerificationResult | null>(
    null
  )

  /**
   * Handles the status change of a collection task.
   * @param taskId - The ID of the task to update.
   * @param newStatus - The new status to set for the task.
   */
  const handleStatusChange = async (
    taskId: number,
    newStatus: CollectionTask['status']
  ) => {
    if (!user) {
      toast.error('กรุณาเข้าสู่ระบบเพื่อเก็บขยะ')
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
        toast.success('อัปเดตสถานะงานเรียบร้อยแล้ว')
      } else {
        toast.error('ไม่สามารถอัปเดตสถานะงานได้ โปรดลองอีกครั้ง')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('ไม่สามารถอัปเดตสถานะงานได้ โปรดลองอีกครั้ง')
    }
  }

  /**
   * Handles the image upload for verification.
   * @param e - The change event from the file input.
   */
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

  /**
   * Extracts the Base64 string from a data URL.
   * @param dataUrl - The data URL containing the Base64 string.
   * @returns The Base64 string.
   */
  const readFileAsBase64 = (dataUrl: string): string => dataUrl.split(',')[1]

  /**
   * Fetch the original (before) image from its URL and convert to Base64.
   */
  async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          // "data:<mime>;base64," prefix
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })
    } catch (error) {
      console.error('Error fetching original image:', error)
      return null
    }
  }

  /**
   * Extracts JSON from a response string.
   * @param text - The response text containing JSON.
   * @returns The extracted JSON string.
   * @throws Will throw an error if JSON format is invalid.
   */
  const extractJSON = (text: string): string => {
    const jsonStart = text.indexOf('{')
    const jsonEnd = text.lastIndexOf('}')
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return text.slice(jsonStart, jsonEnd + 1)
    }
    throw new Error('Invalid JSON format')
  }

  /**
   * New logic: Compare two images (before & after) to check if trash is actually collected.
   */
  const handleVerify = async () => {
    if (!selectedTask || !verificationImage || !user) {
      toast.error('Missing required information for verification.')
      return
    }

    setVerificationStatus('verifying')

    try {
      // 1) Prepare Google Generative AI
      const genAI = new GoogleGenerativeAI(geminiApiKey!)
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // 2) Fetch the original image (before) as Base64
      const originalBase64 = await fetchImageAsBase64(selectedTask.imageUrl)
      if (!originalBase64) {
        throw new Error('Cannot fetch original image as base64.')
      }

      // 3) Read the new image (after) that user uploaded
      const afterBase64 = readFileAsBase64(verificationImage)

      // 4) Combine them into multiple parts:
      const imageParts = [
        {
          inlineData: {
            data: originalBase64,
            mimeType: 'image/jpeg',
          },
        },
        {
          inlineData: {
            data: afterBase64,
            mimeType: 'image/jpeg',
          },
        },
      ]

      // 5) Our new prompt for comparing “before” vs “after”:
      const prompt = `
คุณเป็นผู้เชี่ยวชาญด้านการจัดการขยะและภาพถ่าย
มีภาพ 2 ภาพเรียงลำดับ:
1) ภาพก่อนเก็บขยะ
2) ภาพหลังเก็บขยะ
คุณจะตรวจสอบว่าขยะในภาพแรกได้ถูกเก็บไปจริงหรือไม่ (พื้นที่บริเวณเดียวกันแต่ขยะหายไป) โดยให้ผลลัพธ์เป็น JSON:
{
  "trashIsCollected": true หรือ false,
  "confidence": เลขระหว่าง 0 ถึง 1
}
(ตัวอย่าง: 0.8 คือมั่นใจ 80%)
ห้ามแสดงข้อความอื่นนอกจาก JSON
      `

      // 6) Generate content with prompt + images
      const result = await model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = await response.text()
      console.log('Verification response:', text)

      // 7) Parse the JSON from the response
      const parsedText = extractJSON(text)
      const parsedResult = JSON.parse(parsedText) as CollectVerificationResult

      console.log('Parsed verification result:', parsedResult)
      setVerificationResult(parsedResult)
      setVerificationStatus('success')

      // 8) If the AI says “collected” with high confidence => verify
      if (parsedResult.trashIsCollected && parsedResult.confidence > 0.7) {
        await handleStatusChange(selectedTask.id, 'verified')

        // Give some points & score
        const earnedPoints = 50
        const earnedScore = 20

        await updateUserPoints(user.id, earnedPoints)
        await updateUserScore(user.id, earnedScore)

        await createNotification(
          user.id,
          `การตรวจสอบสำเร็จ! คุณได้รับคะแนน ${earnedPoints} points และ ${earnedScore} scores`,
          'รางวัล'
        )

        toast.success(
          `การตรวจสอบสำเร็จ! คุณได้รับคะแนน ${earnedPoints} points และ ${earnedScore} scores`,
          {
            duration: 5000,
            position: 'top-center',
          }
        )
      } else {
        toast.error(
          'การตรวจสอบล้มเหลว ดูเหมือนขยะยังไม่ได้ถูกเก็บไปจริง',
          {
            duration: 5000,
            position: 'top-center',
          }
        )
      }
    } catch (error) {
      console.error('Error during verification:', error)
      setVerificationStatus('failure')
      toast.error('การตรวจสอบล้มเหลว กรุณาลองอีกครั้ง', {
        duration: 5000,
        position: 'top-center',
      })
    }
  }

  // Filter tasks based on the search term
  const filteredTasks = tasks.filter(task =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate pagination details
  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  // Combine loading states for user and tasks
  const isLoading = userLoading || tasksLoading

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-200">รายงานการเก็บขยะ</h1>

      {/* Search Input */}
      <div className="mb-4 flex items-center text-gray-200">
        <Input
          type="text"
          placeholder="ค้นหาตามพื้นที่"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Map View */}
      {!isLoading && (
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-200 mb-2">Map View</h2>
          <TaskGoogleMap tasks={tasks} />
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : (
        <>
          {/* Task List */}
          <TaskList
            tasks={paginatedTasks}
            user={user}
            onStartCollect={handleStatusChange}
            onVerify={setSelectedTask}
          />

          {/* Pagination Controls */}
          <Pagination
            currentPage={currentPage}
            totalPages={pageCount}
            onPrevious={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            onNext={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
          />
        </>
      )}

      {/* Verification Modal */}
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