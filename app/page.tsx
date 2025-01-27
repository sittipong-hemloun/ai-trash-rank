'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Users, Coins, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getRecentReports, getAllUsers, createUser } from '@/utils/db/actions'
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handler = () => {
      setIsInstalled(true)
      // Optionally, display a toast or alert
      alert('ขอบคุณที่ติดตั้งแอปพลิเคชันของเรา!')
    }
    window.addEventListener('appinstalled', handler)
    return () => window.removeEventListener('appinstalled', handler)
  }, [])

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

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed' }) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
        } else {
          console.log('User dismissed the install prompt');
        }
        setDeferredPrompt(null);
      });
    }
  };

  useEffect(() => {
    const handler = () => setIsInstalled(true);
    window.addEventListener('appinstalled', handler);
    return () => window.removeEventListener('appinstalled', handler);
  }, []);

  useEffect(() => {
    const beforeInstallPromptHandler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallPromptHandler);
    };
  }, []);

  return (
    <div className={` px-4 pb-16 bg-gradient-to-l from-green-900 to-green-900 via-black`}>
      <div className='container mx-auto max-w-6xl'>

        <section className="min-h-screen flex flex-col justify-center">
          {/* Header with Logo and Title */}
          <div className="max-w-5xl mx-auto md:px-6 flex flex-col md:flex-row items-center justify-between md:mb-16 mb-8 md:gap-16 h-full">
            <div className="flex-shrink-0 mb-8 md:mb-0">
              <Image
                src={LogoImg}
                alt="ฮีโร่"
                width={255}
                height={255}
                className=" shadow-lg transform transition-transform duration-300 hover:scale-105"
              />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
                รายงานและตรวจสอบขยะด้วย
                <span className="block text-green-400 mt-2">Generative AI</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 max-w-md mx-auto md:mx-0">
                ร่วมเป็นส่วนหนึ่งกับเรา เพื่อรับสิทธิประโยชน์จากการรายงานขยะและรับรางวัล
              </p>
            </div>
          </div>

          {/* Call to Action Buttons */}
          <div className="flex flex-col items-center md:flex-row md:justify-center gap-6">
            {/* Install PWA Button for Mobile Devices */}
            {!isInstalled && (
              <div className="md:hidden">
                <button
                  onClick={handleInstallClick}
                  className="flex items-center bg-slate-600 hover:bg-slate-700 text-white text-lg py-3 px-6 rounded-full shadow-md transition transform hover:scale-105"
                >
                  ติดตั้งแอป
                  <Download className="ml-2 h-5 w-5" />
                </button>
              </div>
            )}

            {/* Login or Report Button */}
            {isLoading ? (
              <Button className="bg-green-600 text-white text-lg py-6 px-10 rounded-full font-medium transition-all"
                disabled={true}
              >
                กำลังโหลด...
              </Button>
            ) : (
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
          </div>
        </section>


        <section className="bg-gray-800 p-10 rounded-3xl shadow-md border mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center text-gray-200">ผลลัพธ์ที่พวกเราสร้าง</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <ImpactCard title="ผู้ใช้ทั้งหมด" value={`${impactData.totalUsers.toString()} คน`} />
            <ImpactCard title="ปริมาณขยะที่ถูกเก็บแล้ว" value={`${impactData.trashCollected} กิโลกรัม`} />
            <ImpactCard title="จำนวนรายงานที่ได้รับการจัดการ" value={`${impactData.reportsSubmitted.toString()} รายการ`} />
          </div>
        </section>

        <section className="flex flex-col items-center justify-center py-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-12">คุณสมบัติเด่นของเรา</h2>
          <div className="flex flex-wrap justify-center gap-8">
            <FeatureCard
              icon={Leaf}
              title="ประมวลผลด้วย AI"
              description="ระบบอัจฉริยะช่วยตรวจสอบขยะอย่างรวดเร็วและมีประสิทธิภาพ"
            />
            <FeatureCard
              icon={Coins}
              title="รับรางวัล"
              description="สะสมพอยต์จากการรายงานขยะแลกของรางวัลพิเศษได้ง่ายๆ"
            />
            <FeatureCard
              icon={Users}
              title="จัดอันดับผู้ใช้"
              description="แข่งขันและจัดอันดับผู้ใช้เพื่อสร้างแรงจูงใจในการมีส่วนร่วม"
            />
          </div>
        </section>

      </div>
    </div>
  )
}

function ImpactCard({ title, value }: { title: string; value: string | number }) {
  const formattedValue = typeof value === 'number' ? value.toLocaleString('en-US', { maximumFractionDigits: 1 }) : value;

  return (
    <div className="p-6 rounded-xl bg-gray-700 border shadow-sm flex flex-col items-center text-center gap-2">
      <p className="text-sm text-gray-100">{title}</p>
      <p className="text-3xl font-bold mb-2 text-gray-300">{formattedValue}</p>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType; title: string; description: string }) {
  return (
    <div className="bg-gray-800 p-8 rounded-xl shadow-sm border flex flex-col items-center text-center">
      <div className="bg-green-100 p-4 rounded-full mb-6">
        <Icon className="h-8 w-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold mb-4 text-gray-100">{title}</h3>
      <p className="text-gray-300 leading-relaxed">{description}</p>
    </div>
  )
}