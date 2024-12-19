// File: /Users/sittiponghemloun/Developer/my_project/ai-trash-rank-copy/app/collect/page.tsx
/* eslint-disable @next/next/no-img-element */
'use client'
import { useState, useEffect } from 'react'
import { Trash2, MapPin, Upload, Loader, Calendar, Weight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'react-hot-toast'
import { getTrashCollectionTasks, updateTaskStatus, updateUserPoints, updateUserScore, getUserByEmail, createNotification } from '@/utils/db/actions'
import { GoogleGenerativeAI } from "@google/generative-ai"

// Make sure to set your Gemini API key in your environment variables
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY

type CollectionTask = {
  id: number
  location: string
  trashType: string
  amount: string
  status: 'pending' | 'in_progress' | 'completed' | 'verified'
  date: string
  collectorId: number | null
  imageUrl: string
}

const ITEMS_PER_PAGE = 5

export default function CollectPage() {
  const [tasks, setTasks] = useState<CollectionTask[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredTrashType, setHoveredTrashType] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [user, setUser] = useState<{ id: number; email: string; name: string; point: number; score: number } | null>(null)

  useEffect(() => {
    const fetchUserAndTasks = async () => {
      setLoading(true)
      try {
        // Fetch user
        const userEmail = localStorage.getItem('userEmail')
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail)
          if (fetchedUser) {
            setUser(fetchedUser)
          } else {
            toast.error('User not found. Please log in again.')
            // Redirect to login page or handle this case appropriately
          }
        } else {
          toast.error('User not logged in. Please log in.')
          // Redirect to login page or handle this case appropriately
        }

        // Fetch tasks
        const fetchedTasks = await getTrashCollectionTasks()
        setTasks(fetchedTasks as CollectionTask[])
      } catch (error) {
        console.error('Error fetching user and tasks:', error)
        toast.error('Failed to load user data and tasks. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUserAndTasks()
  }, [])

  const [selectedTask, setSelectedTask] = useState<CollectionTask | null>(null)
  const [verificationImage, setVerificationImage] = useState<string | null>(null)
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle')
  const [verificationResult, setVerificationResult] = useState<{
    trashTypeMatch: boolean;
    quantityMatch: boolean;
    confidence: number;
  } | null>(null)

  const handleStatusChange = async (taskId: number, newStatus: CollectionTask['status']) => {
    if (!user) {
      toast.error('Please log in to collect trash.')
      return
    }

    try {
      const updatedTask = await updateTaskStatus(taskId, newStatus, user.id)
      if (updatedTask) {
        setTasks(tasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus, collectorId: user.id } : task
        ))
        toast.success('Task status updated successfully')
      } else {
        toast.error('Failed to update task status. Please try again.')
      }
    } catch (error) {
      console.error('Error updating task status:', error)
      toast.error('Failed to update task status. Please try again.')
    }
  }

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

  const readFileAsBase64 = (dataUrl: string): string => {
    return dataUrl.split(',')[1]
  }

  const convertToJSONFormat = (text: string) => {
    // Remove code block markers and extract JSON string
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = text.slice(jsonStart, jsonEnd + 1);
      return jsonString;
    }
    throw new Error('Invalid JSON format');
  };

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
            mimeType: 'image/jpeg', // Adjust this if you know the exact type
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
        }
        `

      const result = await model.generateContent([prompt, ...imageParts])
      const response = await result.response
      const text = await response.text()

      try {
        const parsedText = convertToJSONFormat(text);
        const parsedResult = JSON.parse(parsedText)
        console.log('Parsed verification result:', parsedResult)
        setVerificationResult({
          trashTypeMatch: parsedResult.trashTypeMatch,
          quantityMatch: parsedResult.quantityMatch,
          confidence: parsedResult.confidence
        })
        setVerificationStatus('success')

        if (parsedResult.trashTypeMatch && parsedResult.quantityMatch && parsedResult.confidence > 0.7) {
          await handleStatusChange(selectedTask.id, 'verified')
          const earnedPoints = 50 // Assign points as per your logic
          const earnedScore = 20 // Assign score as per your logic

          // Update user's points and score
          await updateUserPoints(user.id, earnedPoints)
          await updateUserScore(user.id, earnedScore)

          // Create a notification for the user
          await createNotification(
            user.id,
            `Verification successful! You earned ${earnedPoints} points and ${earnedScore} score!`,
            'reward'
          )

          toast.success(`Verification successful! You earned ${earnedPoints} points and ${earnedScore} score!`, {
            duration: 5000,
            position: 'top-center',
          })
        } else {
          toast.error('Verification failed. The collected trash does not match the reported trash.', {
            duration: 5000,
            position: 'top-center',
          })
        }
      } catch (error) {
        console.log(error);

        console.error('Failed to parse JSON response:', text)
        setVerificationStatus('failure')
      }
    } catch (error) {
      console.error('Error verifying trash:', error)
      setVerificationStatus('failure')
    }
  }

  const filteredTasks = tasks.filter(task =>
    task.location.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const pageCount = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)
  const paginatedTasks = filteredTasks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">รายงานการเก็บขยะ</h1>

      <div className="mb-4 flex items-center">
        <Input
          type="text"
          placeholder="ค้นหาตามพื้นที่"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader className="animate-spin h-8 w-8 text-gray-500" />
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedTasks.map(task => (
              <div key={task.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-lg font-medium text-gray-800 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-gray-500" />
                    {task.location}
                  </h2>
                  <StatusBadge status={task.status} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm text-gray-600 mb-3">
                  <div className="flex items-center relative">
                    <Trash2 className="w-4 h-4 mr-2 text-gray-500" />
                    <span
                      onMouseEnter={() => setHoveredTrashType(task.trashType)}
                      onMouseLeave={() => setHoveredTrashType(null)}
                      className="cursor-pointer"
                    >
                      {/* {task.trashType.length > 8 ? `${task.trashType.slice(0, 8)}...` : task.trashType} */}
                      {task.trashType}
                    </span>
                    {hoveredTrashType === task.trashType && (
                      <div className="absolute left-0 top-full mt-1 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
                        {task.trashType}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center">
                    <Weight className="w-4 h-4 mr-2 text-gray-500" />
                    {task.amount}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-500" />
                    {task.date}
                  </div>
                  {/* Image */}
                  <div className="flex items-center col-span-3">
                    <img src={task.imageUrl} alt="Trash" className="w-full h-80 object-cover rounded-md" />
                  </div>
                </div>
                <div className="flex justify-end">
                  {task.status === 'pending' && (
                    <Button onClick={() => handleStatusChange(task.id, 'in_progress')} variant="outline" size="sm">
                      เริ่มเก็บขยะ
                    </Button>
                  )}
                  {task.status === 'in_progress' && task.collectorId === user?.id && (
                    <Button onClick={() => setSelectedTask(task)} variant="outline" size="sm">
                      เก็บเสร็จสิ้นและตรวจสอบ
                    </Button>
                  )}
                  {task.status === 'in_progress' && task.collectorId !== user?.id && (
                    <span className="text-yellow-600 text-sm font-medium">คนอื่นกำลังดำเนินการ</span>
                  )}
                  {task.status === 'verified' && (
                    <span className="text-green-600 text-sm font-medium">จัดเก็บแล้ว</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="mr-2"
            >
              ก่อนหน้า
            </Button>
            <span className="mx-2 self-center">
              หน้า {currentPage} จาก {pageCount}
            </span>
            <Button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, pageCount))}
              disabled={currentPage === pageCount}
              className="ml-2"
            >
              ถัดไป
            </Button>
          </div>
        </>
      )}

      {selectedTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4">ตรวจสอบการเก็บขยะ</h3>
            <p className="mb-4 text-sm text-gray-600">อัปโหลดรูปขยะที่เก็บเพื่อให้เราตรวจสอบและรอรับ point และ score ของคุณ</p>
            <div className="mb-4">
              <label htmlFor="verification-image" className="block text-sm font-medium text-gray-700 mb-2">
                อัปโหลดรูปขยะที่เก็บ
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label
                      htmlFor="verification-image"
                      className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                    >
                      <span>อัปโหลดรูป</span>
                      <input id="verification-image" name="verification-image" type="file" className="sr-only" onChange={handleImageUpload} accept="image/*" />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF ไปจนถึง 10MB</p>
                </div>
              </div>
            </div>
            {verificationImage && (
              <img src={verificationImage} alt="Verification" className="mb-4 rounded-md w-full" />
            )}
            <Button
              onClick={handleVerify}
              className="w-full"
              disabled={!verificationImage || verificationStatus === 'verifying'}
            >
              {verificationStatus === 'verifying' ? (
                <>
                  <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
                  กำลังตรวจสอบ...
                </>
              ) : 'Verify Collection'}
            </Button>
            {verificationStatus === 'success' && verificationResult && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p>Trash Type Match: {verificationResult.trashTypeMatch ? 'ตรงกัน' : 'ไม่ตรงกัน'}</p>
                <p>Quantity Match: {verificationResult.quantityMatch ? 'ตรงกัน' : 'ไม่ตรงกัน'}</p>
                <p>Confidence: {(verificationResult.confidence * 100).toFixed(2)}%</p>
              </div>
            )}
            {verificationStatus === 'failure' && (
              <p className="mt-2 text-red-600 text-center text-sm">การตรวจสอบล้มเหลว ลองอีกครั้ง</p>
            )}
            <Button onClick={() => setSelectedTask(null)} variant="outline" className="w-full mt-2">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: CollectionTask['status'] }) {
  const statusConfig = {
    pending: { color: 'bg-yellow-100 text-yellow-800' },
    in_progress: { color: 'bg-blue-100 text-blue-800' },
    completed: { color: 'bg-green-100 text-green-800' },
    verified: { color: 'bg-purple-100 text-purple-800' },
  }

  const { color } = statusConfig[status]

  const statusInThai = {
    pending: 'รอดำเนินการ',
    in_progress: 'กำลังดำเนินการ',
    completed: 'เสร็จสิ้น',
    verified: 'ตรวจสอบแล้ว',
  }[status]


  return (
    <div className='w-36 flex justify-end'>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color} flex w-fit items-center`}>
        {statusInThai.replace('_', ' ')}
      </span>
    </div>
  )
}