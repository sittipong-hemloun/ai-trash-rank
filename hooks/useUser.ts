import { User } from "@/app/types/user"
import { getUserByEmail } from "@/utils/db/actions"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

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
            toast.error('User not found. Please log in again.')
            router.push('/')
          }
        } else {
          toast.error('User not logged in. Please log in.')
          router.push('/')
        }
      } catch (error) {
        console.error('Error fetching user:', error)
        toast.error('Failed to load user data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [router])

  return { user, loading, setUser }
}

export default useUser