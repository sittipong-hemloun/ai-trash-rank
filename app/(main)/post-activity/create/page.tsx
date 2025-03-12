// app/post-activity/create/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import toast from "react-hot-toast";
import { createActivities, createPosts, createReward } from "@/utils/db/actions";
import useUser from "@/hooks/useUser";

export default function CreatePostActivityPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"post" | "activity">("post");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // เพิ่ม field "amount" ใน state rewards
  const [rewards, setRewards] = useState<
    { name: string; redeemPoint: number; amount: number }[]
  >([{ name: "", redeemPoint: 1, amount: 1 }]);

  const { user, loading } = useUser();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // อัปเดตค่าของ reward แต่ละฟิลด์
  const updateReward = (
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

  // เพิ่มฟิลด์ reward ใหม่
  const addRewardField = () => {
    setRewards([...rewards, { name: "", redeemPoint: 1, amount: 1 }]);
  };

  // ลบฟิลด์ reward (หากมีมากกว่าหนึ่งฟิลด์)
  const removeRewardField = (index: number) => {
    if (rewards.length > 1) {
      const newRewards = rewards.filter((_, i) => i !== index);
      setRewards(newRewards);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนส่ง");
      return;
    }
    e.preventDefault();
    try {
      let imageString: string | undefined;
      if (image) {
        imageString = await fileToBase64(image);
      }

      if (mode === "post") {
        const post = await createPosts(user.id, title, content, imageString);
        console.log("the post", post);
      } else {
        // ใช้ rewards.length เป็นจำนวนรางวัลที่แนบไปกับกิจกรรม
        const activity = await createActivities(
          user.id,
          title,
          content,
          new Date(startDate),
          new Date(endDate),
          imageString
        );
        console.log("activity from page", activity);
        if (activity) {
          // สร้าง reward ทีละรายการสำหรับกิจกรรมที่สร้างขึ้น
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
        }
      }

      toast.success(
        `${mode === "post" ? "Post" : "Activity"} created successfully!`
      );
      router.push("/post-activity");
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("Cannot create item!");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-200 rounded-2xl">
      <h1 className="text-2xl font-semibold mb-4 text-black">
        เพิ่ม{mode === "post" ? "ข่าวสาร" : "กิจกรรม"}
      </h1>

      {/* ตัวเลือกโหมด */}
      <div className="w-full space-x-4 mb-4">
        <Button
          variant={mode === "post" ? "default" : "outline"}
          onClick={() => setMode("post")}
        >
          เพิ่มข่าวสาร
        </Button>
        <Button
          variant={mode === "activity" ? "default" : "outline"}
          onClick={() => setMode("activity")}
        >
          เพิ่มกิจกรรม
        </Button>

        <Link href="/post-activity">
          <Button className="float-right">ย้อนกลับ</Button>
        </Link>
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
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
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
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </div>

        {/* อัปโหลดรูป */}
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
              onChange={handleImageUpload}
              accept="image/*"
            />
          </label>
        </div>

        {/* ฟิลด์สำหรับกิจกรรม */}
        {mode === "activity" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1 font-medium text-black">
                วันที่เริ่ม
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                max={endDate}
              />
            </div>
            <div>
              <label className="block text-sm mb-1 font-medium text-black">
                วันที่สิ้นสุด
              </label>
              <input
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none"
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {/* ฟิลด์สำหรับรางวัล */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-2 text-black">
                ของรางวัล
              </h3>
              {rewards.map((reward, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  ชื่อ
                  <input
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                    type="text"
                    placeholder="ชื่อของรางวัล"
                    value={reward.name}
                    onChange={(e) =>
                      updateReward(index, "name", e.target.value)
                    }
                    required
                  />
                  คะแนน
                  <input
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                    type="number"
                    min="1"
                    placeholder="คะแนนที่ใช้แลก"
                    value={reward.redeemPoint}
                    onChange={(e) =>
                      updateReward(index, "redeemPoint", e.target.value)
                    }
                    required
                  />
                  จำนวน
                  <input
                    className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                    type="number"
                    min="1"
                    placeholder="จำนวน"
                    value={reward.amount}
                    onChange={(e) =>
                      updateReward(index, "amount", e.target.value)
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
              <Button type="button" onClick={addRewardField} variant="outline">
                เพิ่มของรางวัล
              </Button>
            </div>
          </div>
        )}

        {loading ? (
          <Button type="submit" className="mt-4 w-full" disabled>
            กำลังโหลด...
          </Button>
        ) : (
          <Button type="submit" className="mt-4 w-full">
            เพิ่ม
          </Button>
        )}
      </form>
    </div>
  );
}
