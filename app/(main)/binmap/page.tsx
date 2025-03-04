'use client'

import React, { useEffect, useState } from 'react'
import BinGoogleMap from '@/components/BinGoogleMap'
import Bin from '@/types/bin'
import { getAllBins } from '@/utils/db/actions'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default function BinMap() {
  const [bins, setBins] = useState<Bin[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchBins = async () => {
      const binsData = await getAllBins()
      const formattedBins = binsData.map(bin => ({
        ...bin,
        id: bin.id.toString(),
        status: bin.status as 'active' | 'inactive'
      }))
      setBins(formattedBins as Bin[])
    }
    fetchBins()
  }, [])

  return (
    <div className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-200">แผนที่ถังขยะ</h1>
        <Button
          onClick={() => router.push('/binmap/add-bin')}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          เพิ่มถังขยะ
        </Button>
      </div>
      <div className="rounded-lg overflow-hidden shadow-md border border-gray-200">
        <BinGoogleMap bins={bins} />
      </div>
    </div>
  )
}