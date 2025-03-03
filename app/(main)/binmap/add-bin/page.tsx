'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import FileUpload from '@/components/FileUpload'
import { createBin } from '@/utils/db/actions'
import useUser from '@/hooks/useUser'

export default function AddBinPage() {
  const router = useRouter()
  const { user, loading } = useUser()
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [binType, setBinType] = useState('mixed') // 'mixed' for ถังขยะทั่วไป, 'separated' for ถังขยะที่มีแบบแยกประเภท
  const [binPhoto, setBinPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentCoords({ lat: position.coords.latitude, lng: position.coords.longitude })
        },
        (error) => {
          console.error("Error getting geolocation:", error)
          toast.error("ไม่สามารถรับตำแหน่ง GPS ได้")
        }
      )
    } else {
      toast.error("Geolocation ไม่ได้รับการสนับสนุนในเบราว์เซอร์นี้")
    }
  }, [])

  useEffect(() => {
    if (binPhoto) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(binPhoto)
    } else {
      setPreview(null)
    }
  }, [binPhoto])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อน")
      return
    }
    if (!currentCoords) {
      toast.error("ไม่พบตำแหน่ง GPS")
      return
    }
    setSubmitting(true)
    try {
      const coordsString = `${currentCoords.lat},${currentCoords.lng}`
      const locationText = `ตำแหน่ง: ${currentCoords.lat.toFixed(6)}, ${currentCoords.lng.toFixed(6)}`

      const newBin = await createBin(
        user.id,
        locationText,
        coordsString,
        'active',
        binType === 'mixed' ? 'mixed' : 'separated'
      )

      if (newBin) {
        toast.success("เพิ่มตำแหน่งถังขยะสำเร็จแล้ว!")
        router.push('/binmap')
      } else {
        toast.error("เกิดข้อผิดพลาดในการเพิ่มถังขยะ")
      }
    } catch (error) {
      console.error("Error adding bin:", error)
      toast.error("เกิดข้อผิดพลาดในการเพิ่มถังขยะ")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">เพิ่มตำแหน่งถังขยะ</h1>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-300 hover:text-gray-100"
        >
          ย้อนกลับ
        </button>
      </div>
      {!loading && user ? (
        <form onSubmit={handleSubmit} className="space-y-6 bg-gray-200 p-6 rounded-lg shadow-md">
          {/* <div>
            <label className="block text-lg font-medium mb-2 text-white">ตำแหน่งปัจจุบัน</label>
            {currentCoords ? (
              <p className="text-gray-300">
                {`ละติจูด: ${currentCoords.lat.toFixed(6)}, ลองจิจูด: ${currentCoords.lng.toFixed(6)}`}
              </p>
            ) : (
              <p className="text-gray-300">กำลังค้นหาตำแหน่ง...</p>
            )}
          </div> */}
          <div>
            <label className="block text-lg font-medium mb-2 text-gray-700">รูปถ่ายถังขยะ</label>
            <FileUpload file={binPhoto} setFile={setBinPhoto} preview={preview} />
          </div>
          <div>
            <label className="block text-lg font-medium mb-2 text-gray-700">ประเภทถังขยะ</label>
            <select
              value={binType}
              onChange={(e) => setBinType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md text-black"
            >
              <option value="mixed">ถังขยะทั่วไป (Mixed Waste Bin)</option>
              <option value="separated">ถังขยะที่มีแบบแยกประเภท (Separated Waste Bins)</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md"
              disabled={submitting}
            >
              {submitting ? "กำลังเพิ่ม..." : "เพิ่มถังขยะ"}
            </button>
          </div>
        </form>
      ) : (
        <p className="text-white">Loading...</p>
      )}
    </div>
  )
}