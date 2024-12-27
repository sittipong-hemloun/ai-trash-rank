"use client"

import { useState, useEffect } from "react"
import { Inter } from 'next/font/google'
import "./globals.css"
import Header from "@/components/Header"
import Sidebar from "@/components/Sidebar"
import { Toaster } from 'react-hot-toast'
import { getUserByEmail } from '@/utils/db/actions'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const fetchTotalEarnings = async () => {
      try {
        const userEmail = localStorage.getItem('userEmail')
        if (userEmail) {
          const user = await getUserByEmail(userEmail)
          console.log('User from layout:', user)

          if (user) {
            const userScore = user.score
            console.log('User score from layout:', userScore)
            // Additional logic can be added here if needed
          }
        }
      } catch (error) {
        console.error('Error fetching total earnings:', error)
      }
    }

    fetchTotalEarnings()
  }, [])

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          {/* Header Component */}
          <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
          {/* Sidebar Component */}
          <Sidebar open={sidebarOpen} />

          {/* Main Content Area */}
          <main className="flex-1 p-4 lg:p-8 ml-0 lg:ml-64 transition-all duration-300 bg-slate-100">
            <div className="relative z-10">
              {children}
            </div>
            <div className="absolute inset-0 -z-0">
              <div className="absolute top-1/3 left-3/4 w-96 h-96 bg-gradient-to-r from-green-500 to-green-500 rounded-full blur-3xl opacity-30 animate-pulse"></div>
              <div className="absolute bottom-1/4 right-3/4 w-96 h-96 bg-gradient-to-r from-green-400 to-green-400 rounded-full blur-3xl opacity-30 animate-pulse delay-200"></div>
            </div>
          </main>
        </div>
        {/* Toast Notifications */}
        <Toaster />
      </body>
    </html>
  )
}