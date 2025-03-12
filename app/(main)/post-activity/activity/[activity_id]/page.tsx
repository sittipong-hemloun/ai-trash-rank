"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import useUser from "@/hooks/useUser";
import { 
  getActivityById, 
  getRewardsByActivityId, 
  getActivityRedemptions, // import ฟังก์ชันใหม่
  updateUserPoints,
  decrementRewardAmount,
  createUserReward,
  deleteActivity
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
  amount: number;
  redeemPoint: number;
  createdAt: string;
}

interface Redemption {
  redeemedAt: Date;
  rewardName: string;
  userName: string;
  userEmail: string;
  userPhone: string;
}

export default function ActivityIndexPage() {
  const { activity_id } = useParams();
  const router = useRouter();
  const { user, setUser } = useUser();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);

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

  // ดึงข้อมูล redemptions หากผู้ใช้เป็นเจ้าของกิจกรรม
  useEffect(() => {
    const fetchRedemptions = async () => {
      if (activity && user && user.id === activity.userId) {
        const data = await getActivityRedemptions(activity.id);
        setRedemptions(data);
      }
    };
    fetchRedemptions();
  }, [activity, user]);

  // ฟังก์ชันสำหรับแลกของรางวัล
  const handleRedeem = async (reward: Reward) => {
    if (!user) {
      toast.error("คุณต้องเข้าสู่ระบบเพื่อแลกของรางวัล");
      return;
    }
    if (user.point < reward.redeemPoint) {
      toast.error("คะแนนของคุณไม่เพียงพอสำหรับการแลกของรางวัลนี้");
      return;
    }
    if (reward.amount <= 0) {
      toast.error("ของรางวัลนี้หมดแล้ว");
      return;
    }
    try {
      const updatedUser = await updateUserPoints(user.id, -reward.redeemPoint);
      const updatedReward = await decrementRewardAmount(reward.id);
      const userReward = await createUserReward(user.id, reward.id);
      if (updatedUser && updatedReward && userReward) {
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

  // ฟังก์ชันสำหรับแก้ไขและลบกิจกรรม (เหมือนเดิม)
  const handleEditActivity = () => {
    router.push(`/post-activity/activity/${activity?.id}/edit`);
  };

  const handleDeleteActivity = async () => {
    if (!activity) return;
    const confirmDelete = confirm("คุณแน่ใจหรือไม่ที่จะลบกิจกรรมนี้?");
    if (!confirmDelete) return;
    const success = await deleteActivity(activity.id);
    if (success) {
      toast.success("ลบกิจกรรมสำเร็จ");
      router.push("/post-activity");
    } else {
      toast.error("เกิดข้อผิดพลาดในการลบกิจกรรม");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-200 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        {user && activity && user.id === activity.userId && (
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handleEditActivity}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              แก้ไขกิจกรรม
            </button>
            <button
              onClick={handleDeleteActivity}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              ลบกิจกรรม
            </button>
          </div>
        )}
        <button
          onClick={() => router.push("/post-activity")}
          className="bg-green-500 text-white px-4 py-2 rounded-md ml-auto"
        >
          ย้อนกลับ
        </button>
      </div>
      <h3 className="text-xl text-black mb-2 font-semibold break-words">
        {activity?.name}
      </h3>
      {activity?.image && (
        <img
          src={activity.image}
          alt={activity.name}
          className="w-full h-auto mb-4 rounded-md"
        />
      )}
      <p className="mb-2 break-words">{activity?.content}</p>
      <p className="mb-2">
        วันที่เริ่มต้น:{" "}
        {new Date(activity?.startDate || "").toLocaleDateString()}
      </p>
      <p className="mb-2">
        วันที่สิ้นสุด:{" "}
        {new Date(activity?.endDate || "").toLocaleDateString()}
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

      {/* ตารางแสดงประวัติการแลกของรางวัล (เฉพาะเจ้าของกิจกรรม) */}
      {user && activity && user.id === activity.userId && (
        <div className="mt-8">
          <h4 className="text-lg font-semibold mb-2">ประวัติการแลกของรางวัล</h4>
          {redemptions.length === 0 ? (
            <p>ยังไม่มีการแลกของรางวัล</p>
          ) : (
            <table className="min-w-full bg-white border">
              <thead>
                <tr>
                  <th className="py-2 px-4 border">ชื่อ</th>
                  <th className="py-2 px-4 border">อีเมล</th>
                  <th className="py-2 px-4 border">เบอร์โทรศัพท์</th>
                  <th className="py-2 px-4 border">ของรางวัล</th>
                  <th className="py-2 px-4 border">วันที่แลก</th>
                </tr>
              </thead>
              <tbody>
                {redemptions.map((item, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border">{item.userName}</td>
                    <td className="py-2 px-4 border">{item.userEmail}</td>
                    <td className="py-2 px-4 border">{item.userPhone}</td>
                    <td className="py-2 px-4 border">{item.rewardName}</td>
                    <td className="py-2 px-4 border">
                      {new Date(item.redeemedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
