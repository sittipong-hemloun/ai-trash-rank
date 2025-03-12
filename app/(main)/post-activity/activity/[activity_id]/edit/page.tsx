"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import {
  getActivityById,
  getRewardsByActivityId,
  updateActivity,
  deleteRewardsByActivityId,
  createReward,
} from "@/utils/db/actions";

interface Activity {
  id: number;
  name: string;
  content: string;
  image: string | null;
  startDate: string;
  endDate: string;
  createdAt: string;
  userId: number;
}

interface Reward {
  id?: number;
  name: string;
  redeemPoint: number;
  amount: number;
  createdAt?: string;
}

export default function EditActivityPage() {
  const { activity_id } = useParams();
  const router = useRouter();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [rewards, setRewards] = useState<Reward[]>([]);

  useEffect(() => {
    const fetchActivity = async () => {
      const act = await getActivityById(Number(activity_id));
      if (act) {
        // Convert Date objects to strings to match Activity interface
        setActivity({
          ...act,
          startDate: act.startDate.toISOString(),
          endDate: act.endDate.toISOString(),
          createdAt: act.createdAt.toISOString()
        });
        setTitle(act.name);
        setContent(act.content);
        setStartDate(new Date(act.startDate).toISOString().split("T")[0]);
        setEndDate(new Date(act.endDate).toISOString().split("T")[0]);
        setPreview(act.image || "");
      }
    };
    fetchActivity();
  }, [activity_id]);

  useEffect(() => {
    const fetchRewards = async () => {
      if (activity) {
        const rewardsData = await getRewardsByActivityId(activity.id);
        // Convert Date objects to strings to match Reward interface
        const formattedRewards = rewardsData.map(reward => ({
          ...reward,
          createdAt: reward.createdAt instanceof Date ? reward.createdAt.toISOString() : reward.createdAt
        }));
        setRewards(formattedRewards);
      }
    };
    fetchRewards();
  }, [activity]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const updateRewardField = (
    index: number,
    field: "name" | "redeemPoint" | "amount",
    value: string
  ) => {
    const newRewards = [...rewards];
    if (field === "redeemPoint" || field === "amount") {
      const num = Number(value);
      newRewards[index][field] = isNaN(num) || num <= 0 ? 1 : num;
    } else {
      newRewards[index][field] = value;
    }
    setRewards(newRewards);
  };

  const addRewardField = () => {
    setRewards([...rewards, { name: "", redeemPoint: 1, amount: 1 }]);
  };

  const removeRewardField = (index: number) => {
    if (rewards.length > 1) {
      const newRewards = rewards.filter((_, i) => i !== index);
      setRewards(newRewards);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    try {
      let imageString = preview;
      if (image) {
        imageString = await fileToBase64(image);
      }
      // อัปเดตข้อมูลกิจกรรม
      const updatedActivity = await updateActivity(
        activity.id,
        title,
        content,
        startDate,
        endDate,
        imageString
      );
      if (!updatedActivity) {
        toast.error("เกิดข้อผิดพลาดในการอัปเดตกิจกรรม");
        return;
      }
      // ลบของรางวัลเก่าที่เกี่ยวข้องกับกิจกรรมนี้
      await deleteRewardsByActivityId(activity.id);
      // สร้างของรางวัลใหม่ตามข้อมูลที่กรอก
      for (const reward of rewards) {
        if (reward.name.trim() !== "") {
          await createReward(
            activity.id,
            reward.name,
            reward.redeemPoint,
            reward.amount
          );
        }
      }
      toast.success("แก้ไขกิจกรรมสำเร็จ");
      router.push(`/post-activity/activity/${activity.id}`);
    } catch (error) {
      console.error("Error updating activity:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขกิจกรรม");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-200 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold text-black">แก้ไขกิจกรรม</h1>
        <Button
          type="button"
          onClick={() => router.push(`/post-activity/activity/${activity?.id}`)}
        >
          ยกเลิก
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* หัวข้อ */}
        <div>
          <label className="block text-sm mb-1 font-medium text-black">
            หัวข้อ
          </label>
          <input
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        {/* เนื้อหา */}
        <div>
          <label className="block text-sm mb-1 font-medium text-black">
            เนื้อหา
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        {/* วันที่เริ่มและสิ้นสุด */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1 font-medium text-black">
              วันที่เริ่ม
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-sm mb-1 font-medium text-black">
              วันที่สิ้นสุด
            </label>
            <input
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
            />
          </div>
        </div>
        {/* อัปโหลดรูป */}
        <div className="flex flex-col">
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="verification-image"
              className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
            >
              <span>อัปโหลดรูป</span>
              <input
                id="verification-image"
                name="verification-image"
                type="file"
                className="sr-only"
                onChange={handleImageChange}
                accept="image/*"
              />
            </label>
          </div>

          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt="Preview"
              className="mt-2 w-full h-auto rounded"
            />
          )}
        </div>

        {/* ของรางวัล */}
        <div>
          <h3 className="text-lg font-semibold mb-2 text-black">
            ของรางวัล (Reward)
          </h3>
          {rewards.map((reward, index) => (
            <div key={index} className="flex items-center space-x-2 mb-2">
              <span>ชื่อ</span>
              <input
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                type="text"
                placeholder="ชื่อของรางวัล"
                value={reward.name}
                onChange={(e) =>
                  updateRewardField(index, "name", e.target.value)
                }
                required
              />
              <span>คะแนน</span>
              <input
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                type="number"
                min="1"
                placeholder="คะแนนที่ใช้แลก"
                value={reward.redeemPoint}
                onChange={(e) =>
                  updateRewardField(index, "redeemPoint", e.target.value)
                }
                required
              />
              <span>จำนวน</span>
              <input
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                type="number"
                min="1"
                placeholder="จำนวน"
                value={reward.amount}
                onChange={(e) =>
                  updateRewardField(index, "amount", e.target.value)
                }
                required
              />
              {rewards.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => removeRewardField(index)}
                >
                  ลบ
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addRewardField}>
            เพิ่มของรางวัล
          </Button>
        </div>
        <Button className="mt-4 w-full" type="submit">
          บันทึกการแก้ไข
        </Button>
      </form>
    </div>
  );
}
