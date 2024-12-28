'use client'
import { useState, useEffect } from 'react'
import { ArrowRight, Leaf, Recycle, Users, Coins, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { getRecentReports, getAllUsers } from '@/utils/db/actions'
import Image from 'next/image'
import LogoImg from '@/public/logo.png'

export default function Home() {
  const [loggedIn, setLoggedIn] = useState(false);
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

  const login = () => {
    setLoggedIn(true);
  };

  return (
    <div className={` px-4 py-16 bg-gradient-to-l from-green-300 to-green-300 via-green-50`}>
      <div className='container mx-auto max-w-6xl'>

        <section className="text-center mb-20">
          {/* <AnimatedGlobe /> */}
          <div className='flex justify-center w-44 h-44 mx-auto mb-8'>
            <Image src={LogoImg} alt="Hero" width={500} height={500} />
          </div>
          <h1 className="text-6xl font-bold mb-6 text-gray-800 tracking-tight">
            Zero-to-Hero <span className="text-green-600">Trash Management</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed mb-8">
            Join our community in making trash management more efficient and rewarding!
          </p>
          {!loggedIn ? (
            <Button onClick={login} className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Link href="/report">
              <Button className="bg-green-600 hover:bg-green-700 text-white text-lg py-6 px-10 rounded-full font-medium transition-all duration-300 ease-in-out transform hover:scale-105">
                Report Trash
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </section>

        <section className="grid md:grid-cols-3 gap-10 mb-20">
          <FeatureCard
            icon={Leaf}
            title="Eco-Friendly"
            description="Contribute to a cleaner environment by reporting and collecting trash."
          />
          <FeatureCard
            icon={Coins}
            title="Earn Rewards"
            description="Get tokens for your contributions to trash management efforts."
          />
          <FeatureCard
            icon={Users}
            title="Community-Driven"
            description="Be part of a growing community committed to sustainable practices."
          />
        </section>

        <section className="bg-white p-10 rounded-3xl shadow-lg mb-20">
          <h2 className="text-4xl font-bold mb-12 text-center text-gray-800">Our Impact</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <ImpactCard title="Total Users" value={impactData.totalUsers.toString()} icon={Users} />
            <ImpactCard title="Trash Collected" value={`${impactData.trashCollected} kg`} icon={Recycle} />
            <ImpactCard title="Reports Submitted" value={impactData.reportsSubmitted.toString()} icon={MapPin} />
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
      <p className="text-3xl font-bold mb-2 text-gray-800">{formattedValue}</p>
      <p className="text-sm text-gray-600">{title}</p>
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
