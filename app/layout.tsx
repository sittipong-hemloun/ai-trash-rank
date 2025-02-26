/* eslint-disable @next/next/no-sync-scripts */
"use client"

import { useEffect, useState } from "react"
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
  const [cookieConsent, setCookieConsent] = useState<boolean>(false);

  useEffect(() => {
    const checkCookie = () => {
      if (document.cookie.includes('cwc_consent_zzKwaxZD1kNEbj3Mve5HKhaX')) {
        setCookieConsent(true);
      } else {
        setCookieConsent(false);
      }
    };

    checkCookie();
    const interval = setInterval(checkCookie, 1000);
    return () => clearInterval(interval);
  }, []);

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
          }
        }
      } catch (error) {
        console.error('Error fetching total earnings:', error)
      }
    }

    fetchTotalEarnings()
  }, [])

  return (
    <html lang="th">
      <head>
        <script type="text/javascript" src="https://cookiecdn.com/cwc.js"></script>
        <script
          id="cookieWow"
          type="text/javascript"
          src="https://cookiecdn.com/configs/zzKwaxZD1kNEbj3Mve5HKhaX"
          data-cwcid="zzKwaxZD1kNEbj3Mve5HKhaX"
        ></script>
      </head>
      <body className={inter.className}>
        {children}
        <Toaster />
        {!cookieConsent && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999
          }} />
        )}
      </body>
    </html>
  )
}