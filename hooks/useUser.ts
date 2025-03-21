import { User } from "@/types/user"
import { getUserByEmail } from "@/utils/db/actions"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { useSession, signOut } from "next-auth/react"

/**
 * Custom hook to fetch and manage user information.
 */
const useUser = () => {
      const { data: session, status } = useSession()

  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      // try {
      //   const userEmail = localStorage.getItem('userEmail')
      //   if (userEmail) {
      //     const fetchedUser = await getUserByEmail(userEmail)
      //     if (fetchedUser) {
      //       setUser(fetchedUser)
      //     } else {
      //       toast.error('ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง')
      //       // router.push('')
      //     }
      //   } else {
      //     toast.error('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ กรุณาเข้าสู่ระบบ')
      //     // router.push('')
      //   }
      // } catch (error) {
      //   console.error('Error fetching user:', error)
      //   toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาลองอีกครั้ง')
      // } finally {
      //   setLoading(false)
      // }
      if (status === 'loading') {
        setLoading(true)
      }
      if (status === 'unauthenticated') {
        signOut()
        router.push('/')
      }
      if (status === 'authenticated' && session?.user?.email) {
        const fetchedUser = await getUserByEmail(session.user.email)
        if (fetchedUser) {
          setUser(fetchedUser)
        } else {
          toast.error('ไม่พบผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง')
          // router.push('')
        }
      } else if (status === 'authenticated') {
        toast.error('ไม่พบอีเมลของผู้ใช้ กรุณาเข้าสู่ระบบอีกครั้ง')
      }
      setLoading(false)
    }

    fetchUser()
  }, [router, status])

  return { user, loading, setUser }
}

export default useUser