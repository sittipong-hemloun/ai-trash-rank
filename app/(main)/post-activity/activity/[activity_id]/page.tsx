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
  getActivityRedemptions,
  updateUserPoints,
  decrementRewardAmount,
  createUserReward,
  deleteActivity,
  getActivityImagesByActivityId,
} from "@/utils/db/actions";

import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

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
  userAddress: string | null;
  userPhone: string | null;
}

interface ActivityImage {
  id: number;
  activityId: number;
  url: string;
  createdAt: string;
}

export default function ActivityIndexPage() {
  const { activity_id } = useParams();
  const router = useRouter();
  const { user, setUser } = useUser();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [activityImages, setActivityImages] = useState<ActivityImage[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      const act = await getActivityById(Number(activity_id));
      if (act) {
        const formattedActivity: Activity = {
          ...act,
          rewardCount: 0,
          startDate:
            act.startDate instanceof Date
              ? act.startDate.toISOString()
              : String(act.startDate),
          endDate:
            act.endDate instanceof Date
              ? act.endDate.toISOString()
              : String(act.endDate),
          createdAt:
            act.createdAt instanceof Date
              ? act.createdAt.toISOString()
              : String(act.createdAt),
        };
        setActivity(formattedActivity);
      } else {
        setActivity(null);
      }
    };
    fetchActivity();
  }, [activity_id]);

  useEffect(() => {
    const fetchRewards = async () => {
      if (activity) {
        const rewardsData = await getRewardsByActivityId(activity.id);
        const formattedRewards = rewardsData.map((reward) => ({
          ...reward,
          createdAt:
            reward.createdAt instanceof Date
              ? reward.createdAt.toISOString()
              : String(reward.createdAt),
        }));
        setRewards(formattedRewards);
      }
    };
    fetchRewards();
  }, [activity]);

  useEffect(() => {
    const fetchRedemptions = async () => {
      if (activity && user && user.id === activity.userId) {
        const data = await getActivityRedemptions(activity.id);
        setRedemptions(data);
      }
    };
    fetchRedemptions();
  }, [activity, user]);

  useEffect(() => {
    const fetchImages = async () => {
      if (activity) {
        const images = await getActivityImagesByActivityId(activity.id);
        const formattedImages = images.map((image) => ({
          ...image,
          createdAt:
            image.createdAt instanceof Date
              ? image.createdAt.toISOString()
              : String(image.createdAt),
        }));
        setActivityImages(formattedImages);
      }
    };
    fetchImages();
  }, [activity]);

  const exportCSV = () => {
    if (redemptions.length === 0) {
      toast.error("ไม่มีข้อมูลที่จะส่งออก");
      return;
    }
    const header = ["ชื่อ", "อีเมล", "เบอร์โทรศัพท์", "ที่อยู่", "ของรางวัล", "วันที่แลก"];
    const rows = redemptions.map((item) => [
      `"${item.userName}"`,
      `"${item.userEmail}"`,
      `"${item.userPhone || ""}"`,
      `"${item.userAddress || ""}"`,
      `"${item.rewardName}"`,
      `"${new Date(item.redeemedAt).toLocaleDateString()}"`,
    ]);
    const csvContent = [header, ...rows].map((e) => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "redemptions.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRedeem = async (reward: Reward) => {
    if (!user) {
      toast.error("คุณต้องเข้าสู่ระบบเพื่อแลกของรางวัล");
      return;
    }
    if (!user.address) {
      toast.error("กรุณาเพิ่มที่อยู่ในโปรไฟล์ก่อนแลกของรางวัล");
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
    <div className="max-w-3xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        {user && activity && user.id === activity.userId && (
          <div className="flex space-x-2">
            <button
              onClick={handleEditActivity}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              แก้ไขกิจกรรม
            </button>
            <button
              onClick={handleDeleteActivity}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            >
              ลบกิจกรรม
            </button>
          </div>
        )}
        <button
          onClick={() => router.push("/post-activity")}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
        >
          ย้อนกลับ
        </button>
      </div>

      {user && (
        <p className="text-sm text-gray-600 mb-4">
          ที่อยู่ของคุณ: {user.address ? user.address : "ไม่ได้ระบุ"}
        </p>
      )}

      <h3 className="text-2xl text-gray-800 mb-4 font-semibold break-words">
        {activity?.name}
      </h3>

      {activity?.image && (
        <img
          src={activity.image}
          alt={activity.name}
          className="w-full h-64 object-contain mb-4 rounded-md shadow-sm"
        />
      )}

      {activityImages.length > 0 && (
        <div className="mb-4">
          <Carousel showThumbs={false} autoPlay infiniteLoop>
            {activityImages.map((img) => (
              <div key={img.id}>
                <img
                  src={img.url}
                  alt="activity image"
                  className="w-full h-64 object-contain rounded-md shadow-sm"
                />
              </div>
            ))}
          </Carousel>
        </div>
      )}

      <p className="mb-4 text-gray-700 leading-relaxed break-words">
        {activity?.content}
      </p>
      <p className="mb-2 text-gray-600">
        วันที่เริ่มต้น:{" "}
        {activity?.startDate
          ? new Date(activity.startDate).toLocaleDateString()
          : ""}
      </p>
      <p className="mb-6 text-gray-600">
        วันที่สิ้นสุด:{" "}
        {activity?.endDate
          ? new Date(activity.endDate).toLocaleDateString()
          : ""}
      </p>

      <div>
        <h4 className="text-lg font-semibold text-gray-800 mb-4">
          ของรางวัลที่สามารถแลกได้
        </h4>
        {rewards.length === 0 ? (
          <p className="text-gray-700">ไม่มีของรางวัลสำหรับกิจกรรมนี้</p>
        ) : (
          <ul className="space-y-4">
            {rewards.map((reward) => (
              <li
                key={reward.id}
                className="flex items-center justify-between p-4 bg-white rounded-md shadow-sm border"
              >
                <div>
                  <p className="text-gray-800 font-medium">{reward.name}</p>
                  <p className="text-gray-600 text-sm">
                    คะแนนที่ใช้แลก: {reward.redeemPoint}
                  </p>
                  <p className="text-gray-600 text-sm">
                    คงเหลือ: {reward.amount}
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

      {user && activity && user.id === activity.userId && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-lg font-semibold text-gray-800">
              ประวัติการแลกของรางวัล
            </h4>
            <Button onClick={exportCSV}>Export CSV</Button>
          </div>
          {redemptions.length === 0 ? (
            <p className="text-gray-700">ยังไม่มีการแลกของรางวัล</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full bg-white border overflow-hidden rounded-md shadow-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-2 px-4 border text-gray-700 text-sm">ชื่อ</th>
                    <th className="py-2 px-4 border text-gray-700 text-sm">อีเมล</th>
                    <th className="py-2 px-4 border text-gray-700 text-sm">เบอร์โทรศัพท์</th>
                    <th className="py-2 px-4 border text-gray-700 text-sm">ที่อยู่</th>
                    <th className="py-2 px-4 border text-gray-700 text-sm">ของรางวัล</th>
                    <th className="py-2 px-4 border text-gray-700 text-sm">วันที่แลก</th>
                  </tr>
                </thead>
                <tbody>
                  {redemptions.map((item, index) => (
                    <tr key={index}>
                      <td className="py-2 px-4 border text-gray-700 text-sm">
                        {item.userName}
                      </td>
                      <td className="py-2 px-4 border text-gray-700 text-sm">
                        {item.userEmail}
                      </td>
                      <td className="py-2 px-4 border text-gray-700 text-sm">
                        {item.userPhone}
                      </td>
                      <td className="py-2 px-4 border text-gray-700 text-sm">
                        {item.userAddress}
                      </td>
                      <td className="py-2 px-4 border text-gray-700 text-sm">
                        {item.rewardName}
                      </td>
                      <td className="py-2 px-4 border text-gray-700 text-sm">
                        {new Date(item.redeemedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}