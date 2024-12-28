'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getRecentReports, getAllUsers, createUser, getUserByEmail } from '@/utils/db/actions'
import Image from 'next/image'
import LogoImg from '@/public/logo.png'
import { Web3Auth } from "@web3auth/modal"
import { CHAIN_NAMESPACES, WEB3AUTH_NETWORK } from "@web3auth/base"
import { EthereumPrivateKeyProvider } from "@web3auth/ethereum-provider"

const clientId = process.env.NEXT_PUBLIC_WEB3_AUTH_CLIENT_ID || ""

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: "0xaa36a7",
  rpcTarget: "https://rpc.ankr.com/eth_sepolia",
  displayName: "Ethereum Sepolia Testnet",
  blockExplorerUrl: "https://sepolia.etherscan.io",
  ticker: "ETH",
  tickerName: "Ethereum",
  logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png",
}

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
})

const web3auth = new Web3Auth({
  clientId,
  web3AuthNetwork: WEB3AUTH_NETWORK.TESTNET, // Changed from SAPPHIRE_MAINNET to TESTNET
  privateKeyProvider,
})

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [impactData, setImpactData] = useState({
    trashCollected: 0,
    reportsSubmitted: 0,
    totalUsers: 0,
  });

  useEffect(() => {
    async function fetchImpactData() {
      try {
        const reports = await getRecentReports();
        const totalUsers = (await getAllUsers()).reduce((total) => total + 1, 0);
        const reportsStatusIsSuccess = reports.filter((report) => report.status === 'verified')
        const trashCollected = reportsStatusIsSuccess.reduce((total, task) => {
          // remove "กก ." from quantity
          const amount = parseFloat(task.quantity.replace(/ กก\./g, ''));
          console.log("amount", amount);
          return total + amount;
        }, 0);

        const reportsSubmitted = reports.length;
        setImpactData({
          trashCollected: Math.round(trashCollected * 10) / 10,
          reportsSubmitted,
          totalUsers,
        });
      } catch (error) {
        console.error("Error fetching impact data:", error);
        // Set default values in case of error
        setImpactData({
          trashCollected: 0,
          reportsSubmitted: 0,
          totalUsers: 0,
        });
      }
    }

    fetchImpactData();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        console.log(web3auth.connected)
        if (web3auth.connected) {
          if (!localStorage.getItem('userEmail')) {
            await web3auth.logout()
            console.log('Logged out')
            console.log(web3auth.connected)
            window.location.reload()
          }
        } else {
          if (localStorage.getItem('userEmail')) {
            setLoggedIn(true)
          } else {
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error("Error initializing Web3Auth:", error)
      }
    }

    init()
    setIsLoading(false)
  }, [])

  const login = async () => {
    // if Adapter is already initialized then make it not initialized
    if (web3auth.connected) {
      await web3auth.logout()
    }

    console.log(web3auth.connected)
    await web3auth.initModal()
    try {
      console.log("Web3Auth connected:", web3auth.connected)
      await web3auth.connect()
      console.log('Logged in')
      const user = await web3auth.getUserInfo()
      console.log("User info:", user)
      if (user.email) {
        localStorage.setItem('userEmail', user.email)
        await createUser(
          user.email,
          user.profileImage || 'https://i.pinimg.com/736x/3c/f6/ef/3cf6ef8b32bdb41c8b350f15ee5ac4a5.jpg',
          user.name || 'ไม่ระบุตัวตน'
        )
        setLoggedIn(true)
      }
    } catch (error) {
      console.error("Error during login:", error)
    }
  }

  return (
    <div className={` px-4 py-16 bg-gradient-to-l from-green-300 to-green-300 via-green-50`}>
      <div className='container mx-auto max-w-6xl'>

        <section className="text-center mb-20">
          {/* <AnimatedGlobe /> */}
          <div className='flex justify-center w-44 h-44 mx-auto mb-8'>
            <Image src={LogoImg} alt="ฮีโร่" width={500} height={500} />
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gray-800 tracking-tight">
            รายงานและตรวจสอบขยะด้วย<br />
            <div className='flex justify-center items-center gap-4'>
              <span className="text-green-600">Generative AI</span>
            </div>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            {/* เข้าร่วมชุมชนของเราเพื่อทำให้การจัดการขยะมีประสิทธิภาพและคุ้มค่ามากขึ้น */}
            ร่วมเป็นส่วนหนึ่งกับเรา เพื่อรับสิทธิประโยชน์จากการรายงานขยะและรับรางวัล
          </p>

          {isLoading ? (
            <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105"
              disabled={true}
            >
              กำลังโหลด...
            </Button>
          ) :
            (
              <>
                {!loggedIn ? (
                  <Button onClick={login} className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
                    เข้าสู่ระบบ
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Link href="/report">
                    <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
                      รายงานขยะ
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>

                  </Link>
                )}
              </>
            )}

        </section>

        <section className="grid md:grid-cols-3 gap-10 mb-20">
          <FeatureCard
            icon={Leaf}
            title="ประมวลผลและตรวจสอบด้วย AI"
            description="ไม่ต้องรอนาน ระบบของเราจะช่วยตรวจสอบขยะให้คุณ"
          />
          <FeatureCard
            icon={Coins}
            title="รับรางวัล"
            description="สามารถใช้ point ที่ได้รับจากการรายงานขยะแลกของรางวัลได้"
          />
          <FeatureCard
            icon={Users}
            title="จัดอันดับผู้ใช้"
            description="กระตุ้นให้คุณมีส่วนร่วมในการจัดการขยะ และแข่งขันกับเพื่อนๆ"
          />
        </section>

        <section className="bg-white p-10 rounded-3xl shadow-lg mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-800">ผลลัพธ์ที่พวกเราสร้าง</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <ImpactCard title="ผู้ใช้ทั้งหมด" value={`${impactData.totalUsers.toString()} คน`} icon={Users} />
            <ImpactCard title="ปริมาณขยะที่ถูกเก็บแล้ว" value={`${impactData.trashCollected} กิโลกรัม`} icon={Recycle} />
            <ImpactCard title="จำนวนรายงานที่ได้รับการจัดการ" value={`${impactData.reportsSubmitted.toString()} รายการ`} icon={MapPin} />
          </div>
        </section>
      </div>
    </div>
  )
}

function ImpactCard({ title, value, icon: Icon }: { title: string; value: string | number; icon: React.ElementType }) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;

  return (
    <div className="p-6 rounded-xl bg-gray-50 border border-gray-100 transition-all duration-300 ease-in-out hover:shadow-md">
      <Icon className="h-10 w-10 text-green-500 mb-4" />
      <p className="text-sm text-gray-600">{title}</p>
      <p className="text-3xl font-bold mb-2 text-gray-800">{formattedValue}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <Icon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-800">{title}</h3>
      <p className="text-gray-600 leading-relaxed">{description}</p>
    </div>
  )
}
