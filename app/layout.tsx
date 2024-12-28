"use client"

import { useEffect } from "react"
import { Inter } from 'next/font/google'
import "./globals.css"
import { Toaster } from 'react-hot-toast'
import { getUserByEmail } from '@/utils/db/actions'

const inter = Inter({ subsets: ['latin'] })

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

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
        {children}
        {/* Toast Notifications */}
        <Toaster />
      </body>
    </html>
  )
}