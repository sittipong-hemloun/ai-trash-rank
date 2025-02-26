'use client'

import React, { useEffect, useState } from 'react'
import BinGoogleMap from '@/components/BinGoogleMap'
import Bin from '@/types/bin'
import { getAllBins } from '@/utils/db/actions'
export default function BinMap() {
  const [bins, setBins] = useState<Bin[]>([]);

  useEffect(() => {
    const fetchBins = async () => {
      const bins = await getAllBins();
      const formattedBins = bins.map(bin => ({
        ...bin,
        id: bin.id.toString(),
        status: bin.status as 'active' | 'inactive'
      }));
      setBins(formattedBins as Bin[]);
    }
    fetchBins();
  }, []);

  return (
    <div>
        <h1>Bin Map</h1>
        <BinGoogleMap bins={bins} />
    </div>
  )
}
