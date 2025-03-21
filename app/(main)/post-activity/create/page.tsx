/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  createActivities,
  createPosts,
  createReward,
  createPostImage,
  getUserRoles,
} from "@/utils/db/actions";
import useUser from "@/hooks/useUser";
import { Loader2 } from "lucide-react";

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

  // Additional images for activity mode
  const [activityImages, setActivityImages] = useState<File[]>([]);
  const [activityImagesPreview, setActivityImagesPreview] = useState<string[]>([]);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rewards, setRewards] = useState<
    { name: string; redeemPoint: number; amount: number }[]
  >([{ name: "", redeemPoint: 1, amount: 1 }]);

  const { user, loading } = useUser();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [checkingRoles, setCheckingRoles] = useState(true);

  useEffect(() => {
    if (user) {
      getUserRoles(user.id).then((roles) => {
        setUserRoles(roles);
        setCheckingRoles(false);
      });
    } else {
      setCheckingRoles(false);
    }
  }, [user]);

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // Upload a single featured image
  const handleFeaturedImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFeaturedImage(file);
      const reader = new FileReader();
      reader.onload = () => setFeaturedPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Upload multiple images for Post
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

  // Upload multiple images for Activity
  const handleActivityImagesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // Update reward form fields
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

  // Handle form submission for either Post or Activity
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนส่ง");
      return;
    }

    // If user tries to create Activity but doesn't have role coperate or admin, block
    if (mode === "activity") {
      const hasCoperate = userRoles.includes("coperate");
      const hasAdmin = userRoles.includes("admin");
      if (!hasCoperate && !hasAdmin) {
        toast.error("คุณไม่มีสิทธิ์สร้างกิจกรรม (ต้องเป็น coperate หรือ admin เท่านั้น)");
        return;
      }
    }

    try {
      // Convert featured image if provided
      let featuredImageString: string | undefined;
      if (featuredImage) {
        featuredImageString = await fileToBase64(featuredImage);
      }

      // Creating a POST
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
          toast.success("สร้างโพสต์เรียบร้อย!");
          router.push("/post-activity");
        } else {
          toast.error("ไม่สามารถสร้างโพสต์ได้!");
        }
      } else {
        // Creating an ACTIVITY
        let multipleImagesBase64: string[] = [];
        if (activityImages.length) {
          const promises = activityImages.map((f) => fileToBase64(f));
          multipleImagesBase64 = await Promise.all(promises);
        }

        const newActivity = await createActivities(
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

        if (newActivity && !Array.isArray(newActivity) && "id" in newActivity) {
          // Create rewards
          for (const reward of rewards) {
            if (reward.name.trim() !== "") {
              await createReward(
                newActivity.id,
                reward.name,
                reward.redeemPoint,
                reward.amount
              );
            }
          }
          toast.success("สร้างกิจกรรมเรียบร้อย!");
          router.push("/post-activity");
        } else {
          toast.error("ไม่สามารถสร้างกิจกรรมได้!");
        }
      }
    } catch (error) {
      console.error("Error creating item:", error);
      toast.error("เกิดข้อผิดพลาดในการสร้างรายการ!");
    }
  };

  if (checkingRoles) {
    // Show a simple loader while roles are being fetched
    return (
      <div className="flex justify-center items-center h-60">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">
          เพิ่ม{mode === "post" ? "ข่าวสาร" : "กิจกรรม"}
        </h1>
        <Link href="/post-activity">
          <Button>ย้อนกลับ</Button>
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Button
          variant={mode === "post" ? "default" : "outline"}
          onClick={() => setMode("post")}
        >
          เพิ่มข่าวสาร
        </Button>
        {userRoles.includes("coperate") || userRoles.includes("admin") ? (
          <Button
            variant={mode === "activity" ? "default" : "outline"}
            onClick={() => setMode("activity")}
          >
            เพิ่มกิจกรรม
          </Button>
        ) : (
          <Button variant="outline" disabled>
            เพิ่มกิจกรรมได้เฉพาะองค์กรเท่านั้น
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หัวข้อ
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เนื้อหา
          </label>
          <textarea
            rows={4}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
          />
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            รูปหลัก (Featured Image)
          </label>
          <label
            htmlFor="featured-image"
            className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 border border-gray-200 p-2"
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
              className="mt-2 w-full h-64 object-contain rounded-md shadow-sm"
            />
          )}
        </div>

        {/* Additional Images for post */}
        {mode === "post" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              รูปรอง (Additional Images)
            </label>
            <label
              htmlFor="post-additional-images"
              className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 border border-gray-200 p-2"
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
                    className="w-full h-64 object-contain rounded-md shadow-sm"
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Activity-specific fields */}
        {mode === "activity" && (
          <>
            {/* Start & End Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่เริ่ม
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  max={endDate}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                />
              </div>
            </div>

            {/* Multiple Activity Images */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                รูปภาพอื่น ๆ (หลายรูป)
              </label>
              <label
                htmlFor="activity-images"
                className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 border border-gray-200 p-2"
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
                      className="w-full h-64 object-contain rounded-md shadow-sm"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Rewards */}
            <div>
              <h3 className="text-lg font-semibold mb-2 text-gray-800">
                ของรางวัล
              </h3>
              {rewards.map((reward, index) => (
                <div key={index} className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-gray-700">ชื่อ</span>
                  <input
                    type="text"
                    placeholder="ชื่อของรางวัล"
                    value={reward.name}
                    onChange={(e) => updateReward(index, "name", e.target.value)}
                    required
                    className="w-32 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  />
                  <span className="text-gray-700">คะแนน</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="คะแนนที่ใช้แลก"
                    value={reward.redeemPoint}
                    onChange={(e) => updateReward(index, "redeemPoint", e.target.value)}
                    required
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  />
                  <span className="text-gray-700">จำนวน</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="จำนวน"
                    value={reward.amount}
                    onChange={(e) => updateReward(index, "amount", e.target.value)}
                    required
                    className="w-24 px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
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

        {/* Submit Button */}
        {loading ? (
          <Button type="submit" className="w-full" disabled>
            กำลังโหลด...
          </Button>
        ) : (
          <Button type="submit" className="w-full">
            เพิ่ม
          </Button>
        )}
      </form>
    </div>
  );
}