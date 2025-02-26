/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import useUser from "@/hooks/useUser";
import { 
  getActivityById, 
  getRewardsByActivityId, 
  updateUserPoints 
} from "@/utils/db/actions";

interface Activity {
  id: number;
  name: string;
  content: string;
  image: string | null;
  rewardCount: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  userId: number;
}

interface Reward {
  id: number;
  activityId: number;
  name: string;
  qrCode: string;
  redeemPoint: number;
  createdAt: string;
}

export default function ActivityIndexPage() {
  const { activity_id } = useParams();
  const router = useRouter();
  const { user, setUser } = useUser();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);

  // ดึงข้อมูลกิจกรรมจากฐานข้อมูล
  useEffect(() => {
    const fetchActivity = async () => {
      const act = await getActivityById(Number(activity_id));
      setActivity(act);
    };
    fetchActivity();
  }, [activity_id]);

  // ดึงรายการของรางวัลของกิจกรรม
  useEffect(() => {
    const fetchRewards = async () => {
      if (activity) {
        const rewardsData = await getRewardsByActivityId(activity.id);
        setRewards(rewardsData);
      }
    };
    fetchRewards();
  }, [activity]);

  // ฟังก์ชันสำหรับแลกของรางวัล โดยจะตรวจสอบคะแนนของผู้ใช้และหักคะแนนหากแลกสำเร็จ
  const handleRedeem = async (reward: Reward) => {
    if (!user) {
      toast.error("คุณต้องเข้าสู่ระบบเพื่อแลกของรางวัล");
      return;
    }
    if (user.point < reward.redeemPoint) {
      toast.error("คะแนนของคุณไม่เพียงพอสำหรับการแลกของรางวัลนี้");
      return;
    }
    try {
      // เรียก updateUserPoints โดยส่งค่าลบเพื่อลดคะแนนของผู้ใช้
      const updatedUser = await updateUserPoints(user.id, -reward.redeemPoint);
      if (updatedUser) {
        setUser(updatedUser);
        toast.success(
          `แลกของรางวัล "${reward.name}" สำเร็จ! คะแนนถูกหัก ${reward.redeemPoint} คะแนน`
        );
      } else {
        toast.error("เกิดข้อผิดพลาดในการแลกของรางวัล");
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
      toast.error("เกิดข้อผิดพลาดในการแลกของรางวัล");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-200 rounded-2xl">
      <div className="clearfix mb-4">
        <button
          onClick={() => router.push("/post-activity")}
          className="bg-green-500 text-white px-4 py-2 rounded-md float-right"
        >
          ย้อนกลับ
        </button>
        <h3 className="text-xl text-black mb-2 break-words">
          {activity?.name}
        </h3>
      </div>
      {activity?.image && (
        <img
          src={activity.image}
          alt={activity.name}
          className="w-full h-auto mb-4 rounded-md"
        />
      )}
      <p className="mb-2 break-words">{activity?.content}</p>
      <p className="mb-2">จำนวนรางวัล: {activity?.rewardCount}</p>
      <p className="mb-2">
        วันที่เริ่มต้น: {new Date(activity?.startDate || "").toLocaleDateString()}
      </p>
      <p className="mb-2">
        วันที่สิ้นสุด: {new Date(activity?.endDate || "").toLocaleDateString()}
      </p>

      {/* แสดงรายการของรางวัล */}
      <div className="mt-6">
        <h4 className="text-lg font-semibold mb-2">ของรางวัลที่สามารถแลกได้</h4>
        {rewards.length === 0 ? (
          <p>ไม่มีของรางวัลสำหรับกิจกรรมนี้</p>
        ) : (
          <ul className="space-y-4">
            {rewards.map((reward) => (
              <li
                key={reward.id}
                className="flex items-center justify-between p-4 bg-white rounded-md shadow"
              >
                <div>
                  <p className="text-black font-medium">{reward.name}</p>
                  <p className="text-gray-600">
                    คะแนนที่ใช้แลก: {reward.redeemPoint}
                  </p>
                </div>
                <Button onClick={() => handleRedeem(reward)}>
                  แลกของรางวัล
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
