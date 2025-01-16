"use client"

import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import { useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (


    <div className="min-h-screen flex flex-col">
      {/* Header Component */}
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      {/* Sidebar Component */}
      <Sidebar open={sidebarOpen} />

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300 bg-slate-900">
        <div className="relative z-10">
          {children}
        </div>
        <div className="absolute inset-0 -z-0 overflow-hidden">
          <div className="absolute top-1/3 left-3/4 w-96 h-96 bg-gradient-to-r from-green-500 to-green-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
          <div className="absolute bottom-1/4 right-3/4 w-96 h-96 bg-gradient-to-r from-green-400 to-green-400 rounded-full blur-3xl opacity-30 animate-pulse delay-200"></div>
        </div>
      </main>
    </div>

  )
}