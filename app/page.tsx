"use client";

import React, { useEffect } from 'react'

export default function Page() {
  useEffect(() => {
    window.location.href = '/report'
  }, [])

  return (
    <div>page</div>
  )
}
