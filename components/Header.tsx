'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Bell, Menu, Star } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
// import { Web3Auth } from "@web3auth/modal"
// import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base"
// import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"
import {
  createUser,
  getUnreadNotifications,
  getUserByEmail,
  markNotificationAsRead
} from "@/utils/db/actions"
import Image from "next/image"
import NotificationType from "@/types/noti"
import { useSession, signOut } from "next-auth/react"
import useUser from "@/hooks/useUser"

// const clientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || ""

// const chainConfig = {
//   chainNamespace: CHAIN_NAMESPACES.EIP155,
//   chainId: "0xaa36a7",
//   rpcTarget: "https://rpc.ankr.com/eth_sepolia",
//   displayName: "Ethereum Sepolia Testnet",
//   blockExplorerUrl: "https://sepolia.etherscan.io",
//   ticker: "ETH",
//   tickerName: "Ethereum",
//   logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
// }

// const privateKeyProvider = new EthereumPrivateKeyProvider({
//   config: { chainConfig },
// })

// // Change from WEB3AUTH_NETWORK.TESTNET to WEB3AUTH_NETWORK.SAPPHIRE_DEVNET
// const web3auth = new Web3Auth({
//   clientId,
//   web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
//   privateKeyProvider,
// })

interface HeaderProps {
  onMenuClick: () => void
}

/**
 * Header component containing navigation and user actions.
 */
export default function Header({ onMenuClick }: HeaderProps) {
  const { user: userInfo } = useUser()
  const { data: session } = useSession()
  // const [, setLoggedIn] = useState(false)
  const [loading, setLoading] = useState(true)
  // const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [point, setPoint] = useState(0)

  // console.log('User info:', user)

  useEffect(() => {
    async function handleUserSync() {
      if (session?.user?.email) {
        try {
          // 1) Create or update user in DB
          await createUser(
            session.user.email,
            session.user.image ?? 'https://i.pinimg.com/736x/3c/f6/ef/3cf6ef8b32bdb41c8b350f15ee5ac4a5.jpg',
            session.user.name ?? 'ไม่ระบุตัวตน'
          )
          // 2) Retrieve user from DB to get points
          const dbUser = await getUserByEmail(session.user.email)
          if (dbUser?.point) {
            setPoint(dbUser.point)
          }
        } catch (error) {
          console.error("Error syncing user with DB:", error)
        }
      }
      // const userFromDB = await getUserByEmail(localStorage.getItem('userEmail') || "")
      // const userDBProfileImage = userFromDB?.profileImage || ""
      // setUserInfo({
      //   ...userFromDB,
      //   profileImage: userDBProfileImage,
      // } as UserInfo)



      setLoading(false)
    }
    handleUserSync()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])



  /**
   * Initializes Web3Auth and fetches user information if already connected.
   */
  // useEffect(() => {
  //   const init = async () => {
  //     try {
  //       setLoggedIn(true)
  //       const userFromDB = await getUserByEmail(localStorage.getItem('userEmail') || "")
  //       const userDBProfileImage = userFromDB?.profileImage || ""

  //       setUserInfo({
  //         ...userFromDB,
  //         profileImage: userDBProfileImage,
  //       } as UserInfo)
  //       if (userFromDB) {
  //         localStorage.setItem('userEmail', userFromDB.email)
  //         try {
  //           await createUser(
  //             userFromDB.email,
  //             userFromDB.profileImage || "https://upload.wikimedia.org/wikipedia/en/thumb/c/c7/Chill_guy_original_artwork.jpg/220px-Chill_guy_original_artwork.jpg",
  //             userFromDB.name || 'ไม่ระบุตัวตน'
  //           )
  //         } catch (error) {
  //           console.error("Error creating user:", error)
  //         }
  //       }
  //     } catch (error) {
  //       console.error("Error initializing Web3Auth:", error)
  //     } finally {
  //       setLoading(false)
  //     }
  //   }

  //   init()
  // }, [])

  /**
   * Fetches unread notifications periodically.
   */
  useEffect(() => {
    const fetchNotifications = async () => {
      if (userInfo && userInfo.email) {
        const user = await getUserByEmail(userInfo.email)
        if (user) {
          const unreadNotifications = await getUnreadNotifications(user.id)
          setNotifications(unreadNotifications)
        }
      }
    }

    fetchNotifications()

    // Set up periodic checking for new notifications every 30 seconds
    const notificationInterval = setInterval(fetchNotifications, 30000)

    return () => clearInterval(notificationInterval)
  }, [userInfo])

  /**
   * Fetches and updates the user's points.
   */
  useEffect(() => {
    const fetchUserPoint = async () => {
      if (userInfo && userInfo.email) {
        const user = await getUserByEmail(userInfo.email)
        if (user) {
          setPoint(user.point)
        }
      }
    }

    fetchUserPoint()

    // Listen for point updates
    const handlePointUpdate = (event: CustomEvent) => {
      setPoint(event.detail)
    }

    window.addEventListener('pointUpdated', handlePointUpdate as EventListener)

    return () => {
      window.removeEventListener('pointUpdated', handlePointUpdate as EventListener)
    }
  }, [userInfo])

  /**
   * Handles user login using Web3Auth.
   */
  // const login = async () => {
  //   if (!web3auth) {
  //     console.log("Web3Auth not initialized yet")
  //     return
  //   }
  //   try {
  //     await web3auth.connect()
  //     setLoggedIn(true)
  //     console.log('Logged in')

  //     const user = await web3auth.getUserInfo()
  //     console.log("User info:", user)
  //     // setUserInfo({
  //     //   ...user,
  //     //   verifier: user.verifier || "",
  //     // } as UserInfo)

  //     if (user.email) {
  //       localStorage.setItem('userEmail', user.email)
  //       try {
  //         await createUser(
  //           user.email,
  //           user.profileImage || 'https://i.pinimg.com/736x/3c/f6/ef/3cf6ef8b32bdb41c8b350f15ee5ac4a5.jpg',
  //           user.name || 'ไม่ระบุตัวตน'
  //         )
  //       } catch (error) {
  //         console.error("Error creating user:", error)
  //         // Optionally handle the error
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error during login:", error)
  //   }
  // }

  /**
   * Handles user logout using Web3Auth.
   */
  // const logout = async () => {
  //   try {
  //     localStorage.removeItem('userEmail')
  //     setLoggedIn(false)
  //     setUserInfo(null)
  //     router.push('/')
  //   } catch (error) {
  //     console.error("Error during logout:", error)
  //   }
  // }
  const logout = async () => {
    await signOut(({ callbackUrl: '/' }))
    // setUserInfo(null)
  }

  /**
   * Fetches user information if connected.
   */
  // const getUserInfo = async () => {
  //   if (web3auth.connected) {
  //     const user = await web3auth.getUserInfo()
  //     const userFromDB = await getUserByEmail(localStorage.getItem('userEmail') || "")
  //     const userDBProfileImage = userFromDB?.profileImage || ""
  //     if (user) {
  //       setUserInfo({
  //         ...user,
  //         profileImage: userDBProfileImage,
  //         verifier: user.verifier || "",
  //       } as UserInfo)
  //       if (user.email) {
  //         localStorage.setItem('userEmail', user.email)
  //         try {
  //           await createUser(
  //             user.email,
  //             user.profileImage || 'https://i.pinimg.com/736x/3c/f6/ef/3cf6ef8b32bdb41c8b350f15ee5ac4a5.jpg',
  //             user.name || 'ไม่ระบุตัวตน'
  //           )
  //         } catch (error) {
  //           console.error("Error creating user:", error)
  //           // Optionally handle the error
  //         }
  //       }
  //     }
  //   }
  // }

  if (loading) {
    return <header className="bg-green-950 shadow-2xl sticky top-0 z-50 border-b border-black">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Text Logo */}
        <Link href="/" className="hidden md:block">
          <h1 className="text-white text-2xl font-bold">AI TRASH RANK</h1>
        </Link>
        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
            <Menu className="h-6 w-6 text-white" />
          </Button>
        </div>
      </div>
    </header>
  }

  /**
   * Handles clicking on a notification by marking it as read.
   * @param notificationId - The ID of the notification to mark as read.
   */
  const handleNotificationClick = async (notificationId: number) => {
    await markNotificationAsRead(notificationId)
    setNotifications(prevNotifications =>
      prevNotifications.filter(notification => notification.id !== notificationId)
    )
  }

  return (
    <header className="bg-green-950 shadow-2xl sticky top-0 z-50 border-b border-black">
      <div className="flex items-center justify-between px-4 py-2">
        {/* Text Logo */}
        <Link href="/" className="hidden md:block">
          <h1 className="text-white text-2xl font-bold">AI TRASH RANK</h1>
        </Link>
        {/* Mobile Menu Button */}
        <div className="flex items-center md:hidden">
          <Button variant="ghost" size="icon" className="mr-2 md:mr-4" onClick={onMenuClick}>
            <Menu className="h-6 w-6 text-white" />
          </Button>
        </div>
        <div className="hidden items-center md:flex">
          <Link href="/report">
            <Button variant="ghost" className="text-white text-sm md:text-base">รายงานขยะ</Button>
          </Link>
          <div className="mx-2 md:mx-4 text-white">
            |
          </div>
          <Link href="/collect">
            <Button variant="ghost" className="text-white text-sm md:text-base">เก็บขยะ</Button>
          </Link>
          <div className="mx-2 md:mx-4 text-white">
            |
          </div>
          <Link href="/binmap">
            <Button variant="ghost" className="text-white text-sm md:text-base">พิกัดถังขยะ</Button>
          </Link>
          <div className="mx-2 md:mx-4 text-white">
            |
          </div>
          <Link href="/post-activity">
            <Button variant="ghost" className="text-white text-sm md:text-base">ข่าวสารและของรางวัล</Button>
          </Link>
          <div className="mx-2 md:mx-4 text-white">
            |
          </div>
          <Link href="/quiz">
            <Button variant="ghost" className="text-white text-sm md:text-base">ควิซ</Button>
          </Link>
          <div className="mx-2 md:mx-4 text-white">
            |
          </div>
          <Link href="/ranking">
            <Button variant="ghost" className="text-white text-sm md:text-base">อันดับ</Button>
          </Link>
          <div className="mx-2 md:mx-4 text-white">
            |
          </div>
          <Link href="/profile">
            <Button variant="ghost" className="text-white text-sm md:text-base">โปรไฟล์</Button>
          </Link>
        </div>
        {/* Right-side Icons and User Actions */}
        <div className="flex items-center">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="mr-2 relative">
                <Bell className="h-5 w-5  text-white" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1 min-w-[1.2rem] h-5">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex flex-col">
                      <span className="font-medium">{notification.type}</span>
                      <span className="text-sm text-gray-500">{notification.message}</span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem>
                  ไม่มีการแจ้งเตือนใหม่
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Points Display */}
          <div className="mr-2 md:mr-4 flex items-center bg-gray-100 rounded-full px-2 md:px-3 py-1">
            <Star className="h-4 w-4 md:h-5 md:w-5 mr-1 text-green-500" />
            <span className="font-semibold text-sm md:text-base text-gray-800">
              {point.toFixed(2)}
            </span>
          </div>

          {/* Login/Logout Button */}
          {!session?.user ? (
            // <Button onClick={login} className="bg-green-600 hover:bg-green-700 text-white text-sm md:text-base">
            //   เข้าสู่ระบบ
            // </Button>
            <div className="flex items-center">
            </div>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="flex items-center">
                  <Image
                    src={userInfo?.profileImage || 'https://i.pinimg.com/736x/3c/f6/ef/3cf6ef8b32bdb41c8b350f15ee5ac4a5.jpg'}
                    alt="Profile"
                    className="w-8 h-8 rounded-full"
                    width={50}
                    height={50}
                  />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  {userInfo ? userInfo.name : "Fetch User Info"}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/profile">โปรไฟล์</Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Link href="/reward">รางวัลของฉัน</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout}>ออกจากระบบ</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  )
}