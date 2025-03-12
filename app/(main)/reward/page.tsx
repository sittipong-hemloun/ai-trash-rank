"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import useUser from "@/hooks/useUser";
import { getUserRewards } from "@/utils/db/actions";

interface UserReward {
  redeemedAt: string;
  rewardId: number;
  name: string;
  redeemPoint: number;
}

export default function RewardPage() {
  const { user } = useUser();
  const [rewards, setRewards] = useState<UserReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRewards() {
      if (!user) {
        toast.error("คุณต้องเข้าสู่ระบบเพื่อดูของรางวัลที่แลกแล้ว");
        setIsLoading(false);
        return;
      }
      try {
        const data = await getUserRewards(user.id);
        setRewards(data);
      } catch (error) {
        console.error("Error fetching user rewards:", error);
        toast.error("เกิดข้อผิดพลาดในการโหลดของรางวัล");
      } finally {
        setIsLoading(false);
      }
    }
    fetchRewards();
  }, [user]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <h1 className="text-3xl font-semibold mb-6 text-white">
        รางวัลของฉัน
      </h1>
        <div className="max-w-2xl mx-auto p-6 bg-gray-100 rounded-md">
        {rewards.length === 0 ? (
            <p>ยังไม่มีการแลกของรางวัล</p>
        ) : (
            <ul className="space-y-4">
            {rewards.map((reward) => (
                <li key={reward.rewardId} className="p-4 bg-white rounded-md shadow">
                <p className="text-lg font-medium">{reward.name}</p>
                <p className="text-gray-600">คะแนนที่ใช้แลก: {reward.redeemPoint}</p>
                <p className="text-sm text-gray-500">
                    วันที่แลก: {new Date(reward.redeemedAt).toLocaleDateString()}
                </p>
                </li>
            ))}
            </ul>
        )}
        </div>
    </div>

  );
}
