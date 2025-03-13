"use client"

import { useEffect, useState } from "react"
import { Loader } from "lucide-react"
import toast from "react-hot-toast"
import { useRouter } from "next/navigation"
import useUser from "@/hooks/useUser"
import { updateUserInfo } from "@/utils/db/actions"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

/**
 * A page to display and edit the currently logged-in user's profile.
 */
export default function ProfilePage() {
  const router = useRouter()
  const { user, loading, setUser } = useUser()

  // Local state for editing
  const [name, setName] = useState<string>("")
  const [phoneNumber, setPhoneNumber] = useState<string>("")
  const [address, setAddress] = useState<string>("")
  const [profileImage, setProfileImage] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  /**
   * Populate form fields with user data once loaded
   */
  useEffect(() => {
    if (!loading && user) {
      setName(user.name || "")
      setPhoneNumber(user.phoneNumber || "")
      setAddress(user.address || "")
      setProfileImage(user.profileImage || null)
    }
  }, [user, loading])

  /**
   * If user is not logged in (null), redirect home
   */
  useEffect(() => {
    if (!loading && !user) {
      router.push("")
    }
  }, [loading, user, router])

  /**
   * Handle file input for the profile image
   */
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setProfileImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  /**
   * Update user info in DB
   */
  const handleSave = async () => {
    if (!user) return
    try {
      setIsSaving(true)
      const updated = await updateUserInfo(user.id, name, phoneNumber, profileImage ?? undefined, address)
      if (updated) {
        // Update local state (so header, etc. updates)
        setUser(updated)
        toast.success("อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว")
      } else {
        toast.error("ไม่สามารถอัปเดตข้อมูลได้ โปรดลองอีกครั้ง")
      }
    } catch (error) {
      console.error("Error updating user profile:", error)
      toast.error("เกิดข้อผิดพลาดในการอัปเดตข้อมูล")
    } finally {
      setIsSaving(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="animate-spin h-8 w-8 text-gray-500" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-semibold mb-6 text-gray-200">ข้อมูลโปรไฟล์</h1>

      <section className="bg-white p-6 rounded-md shadow-md">
        {/* Email (read-only) */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            อีเมล
          </label>
          <Input
            type="email"
            value={user.email}
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            ชื่อ
          </label>
          <Input
            type="text"
            placeholder="ชื่อ"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* Phone Number */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            เบอร์โทรศัพท์
          </label>
          <Input
            type="text"
            placeholder="เบอร์โทรศัพท์"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
        </div>

        {/* Address */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            ที่อยู่
          </label>
          <Input
            type="text"
            placeholder="ที่อยู่"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Profile Image Upload */}
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-1">
            รูปโปรไฟล์
          </label>
          <Input type="file" accept="image/*" onChange={handleFileChange} />
          {profileImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profileImage}
              alt="Profile Preview"
              className="mt-4 max-w-[150px] rounded-md border shadow"
            />
          )}
        </div>

        <div className="flex items-center w-full justify-end">
          <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 text-white">
            {isSaving ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </section>
    </div>
  )
}