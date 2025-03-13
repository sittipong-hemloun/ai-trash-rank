/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  createActivities,
  createPosts,
  createReward,
  createPostImage
} from "@/utils/db/actions";
import useUser from "@/hooks/useUser";

export default function CreatePostActivityPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"post" | "activity">("post");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [featuredPreview, setFeaturedPreview] = useState<string>("");

  // Additional images for post mode
  const [additionalImages, setAdditionalImages] = useState<File[]>([]);
  const [additionalImagesPreview, setAdditionalImagesPreview] = useState<string[]>([]);

  const [activityImages, setActivityImages] = useState<File[]>([]);
  const [activityImagesPreview, setActivityImagesPreview] = useState<string[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rewards, setRewards] = useState<
    { name: string; redeemPoint: number; amount: number }[]
  >([{ name: "", redeemPoint: 1, amount: 1 }]);

  const { user, loading } = useUser();

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onload = () => setFeaturedPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAdditionalImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setAdditionalImages((prev) => [...prev, ...newFiles]);
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setAdditionalImagesPreview((prevPreviews) => [
          ...prevPreviews,
          reader.result as string,
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleActivityImagesUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);

    setActivityImages((prev) => [...prev, ...newFiles]);

    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setActivityImagesPreview((prevPreviews) => [
          ...prevPreviews,
          reader.result as string,
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

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
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนส่ง");
      return;
    }

    try {
      let featuredImageString: string | undefined;
      if (featuredImage) {
        featuredImageString = await fileToBase64(featuredImage);
      }

      if (mode === "post") {
        const post = await createPosts(
          user.id,
          user.name,
          user.profileImage,
          title,
          content,
          featuredImageString
        );
        if (!Array.isArray(post)) {
          // Upload additional images if any
          if (additionalImages.length > 0) {
            for (const file of additionalImages) {
              const base64 = await fileToBase64(file);
              await createPostImage(post.id, base64);
            }
          }
          toast.success("Post created successfully!");
          router.push("/post-activity");
        } else {
          toast.error("Cannot create post!");
        }
      } else {
        let multipleImagesBase64: string[] = [];
        if (activityImages.length) {
          const promises = activityImages.map((f) => fileToBase64(f));
          multipleImagesBase64 = await Promise.all(promises);
        }

        const activity = await createActivities(
          user.id,
          user.name,
          user.profileImage,
          title,
          content,
          new Date(startDate),
          new Date(endDate),
          featuredImageString,
          multipleImagesBase64
        );

        if (activity && !Array.isArray(activity) && "id" in activity) {
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
          toast.success("Activity created successfully!");
          router.push("/post-activity");
        } else {
          toast.error("Cannot create activity!");
        }
      }
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

        <div className="flex flex-col">
          <label className="block text-sm mb-1 font-medium text-black">
            รูปหลัก (Featured Image)
          </label>
          <label
            htmlFor="featured-image"
            className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500 text-sm p-2"
          >
            อัปโหลดรูป
            <input
              id="featured-image"
              name="featured-image"
              type="file"
              className="sr-only"
              onChange={handleFeaturedImageUpload}
              accept="image/*"
            />
          </label>

          {featuredPreview && (
            <img
              src={featuredPreview}
              alt="Preview"
              className="mt-2 w-full h-64 object-contain rounded"
            />
          )}
        </div>

        {mode === "post" && (
          <div className="flex flex-col">
            <label className="block text-sm mb-1 font-medium text-black">
              รูปรอง (Additional Images)
            </label>
            <label
              htmlFor="post-additional-images"
              className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500 text-sm p-2"
            >
              เลือกรูปหลายรูป
              <input
                id="post-additional-images"
                name="post-additional-images"
                type="file"
                className="sr-only"
                onChange={handleAdditionalImagesUpload}
                accept="image/*"
                multiple
              />
            </label>

            {additionalImagesPreview.length > 0 && (
              <div className="mt-2 grid grid-cols-3 gap-2">
                {additionalImagesPreview.map((previewUrl, idx) => (
                  <img
                    key={idx}
                    src={previewUrl}
                    alt="preview additional"
                    className="w-full h-64 object-contain rounded"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {mode === "activity" && (
          <>
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
            </div>

            <div>
              <label className="block text-sm mb-1 font-medium text-black">
                รูปภาพอื่น ๆ (หลายรูป)
              </label>
              <label
                htmlFor="activity-images"
                className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500 text-sm p-2"
              >
                เลือกรูปหลายรูป
                <input
                  id="activity-images"
                  name="activity-images"
                  type="file"
                  className="sr-only"
                  onChange={handleActivityImagesUpload}
                  accept="image/*"
                  multiple
                />
              </label>

              {activityImagesPreview.length > 0 && (
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {activityImagesPreview.map((previewUrl, idx) => (
                    <img
                      key={idx}
                      src={previewUrl}
                      alt="preview"
                      className="w-full h-64 object-contain rounded"
                    />
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2 text-black">
                ของรางวัล
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
                      updateReward(index, "name", e.target.value)
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
                      updateReward(index, "redeemPoint", e.target.value)
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
              <Button type="button" variant="outline" onClick={addRewardField}>
                เพิ่มของรางวัล
              </Button>
            </div>
          </>
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