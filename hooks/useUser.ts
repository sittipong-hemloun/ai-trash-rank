import { User } from "@/types/user"
import { getUserByEmail } from "@/utils/db/actions"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

/**
 * Custom hook to fetch and manage user information.
 */
const useUser = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail')
        if (userEmail) {
          const fetchedUser = await getUserByEmail(userEmail)
          if (fetchedUser) {
            setUser(fetchedUser)
          } else {
            toast.error('ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง')
            // router.push('')
          }
        } else {
          toast.error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบ')
          // router.push('')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาลองอีกครั้ง')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  return { user, loading, setUser }
}

export default useUser