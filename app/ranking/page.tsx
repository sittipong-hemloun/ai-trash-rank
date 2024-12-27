'use client'
import { useState, useEffect } from 'react'
import { getAllUsers } from '@/utils/db/actions'
import { Loader, Award, Crown } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { User as UserType } from '@/app/types/user'
import Image from 'next/image'

export default function RankingPage() {
  const [loading, setLoading] = useState(true)
  const [allUsers, setAllUsers] = useState<UserType[]>([])

  // get all users
  useEffect(() => {
    const fetchRewardsAndUser = async () => {
      setLoading(true)
      try {
        const allUser = await getAllUsers()
        setAllUsers(allUser)
      } catch (error) {
        console.error('Error fetching rewards and user:', error)
        toast.error('Failed to load rangking. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchRewardsAndUser()
  }, [])

  return (
    <div className="">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-semibold mb-6 text-gray-800">อันดับคะแนน </h1>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader className="animate-spin h-8 w-8 text-gray-600" />
          </div>
        ) : (
          <div className="bg-white rounded-md overflow-hidden border border-gray-200">
            <div className="bg-green-500 p-2">
              <div className="flex justify-between items-center text-white">
                <span className="text-xl pl-2 font-bold">ผู้ที่มีคะแนนสูงสุด</span>
                <Award className="h-10 w-10" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">อันดับ</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ผู้ใช้</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">คะแนน</th>
                  </tr>
                </thead>
                <tbody>
                  {/* all users */}
                  {allUsers.map((user, index) => (
                    <tr key={user.id} className={`${user && user.id === user.id ? 'bg-slate-50' : ''} `}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 ? (
                            <Crown className={`h-6 w-6 ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-400' : 'text-yellow-600'}`} />
                          ) : (
                            <span className="text-sm font-medium text-gray-900">{index + 1}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <Image
                              src={user?.profileImage || 'https://i.pinimg.com/736x/3c/f6/ef/3cf6ef8b32bdb41c8b350f15ee5ac4a5.jpg'}
                              alt="Profile"
                              className="w-8 h-8 rounded-full"
                              width={50}
                              height={50}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Award className="h-5 w-5 text-indigo-500 mr-2" />
                          <div className="text-sm font-semibold text-gray-900">{user.score.toLocaleString()}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
