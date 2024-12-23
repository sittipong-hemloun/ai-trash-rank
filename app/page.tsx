"use client";

import React, { useEffect } from 'react'

export default function Page() {

  // redirect to report page
  useEffect(() => {
    window.location.href = '/report'
  }, [])

  return (
    <div>page</div>
  )
}
