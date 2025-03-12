"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPostById, updatePost } from "@/utils/db/actions";
import useUser from "@/hooks/useUser";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface Post {
  id: number;
  name: string;
  content: string;
  image: string;
  createdAt: Date;
  userId: number;
}

export default function EditPostPage() {
  const { post_id } = useParams();
  const router = useRouter();
  const { user } = useUser();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  useEffect(() => {
    const fetchPost = async () => {
      const postData = await getPostById(Number(post_id));
      if (postData) {
        setPost(postData);
        setTitle(postData.name);
        setContent(postData.content);
        setPreview(postData.image);
      }
    };
    fetchPost();
  }, [post_id]);

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
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    try {
      let imageString = preview;
      if (image) {
        imageString = await fileToBase64(image);
      }
      // updatePost เป็นฟังก์ชันสำหรับอัปเดตโพสต์ในฐานข้อมูล
      const updated = await updatePost(post.id, title, content, imageString);
      if (updated) {
        toast.success("แก้ไขโพสต์สำเร็จ");
        router.push(`/post-activity/post/${post.id}`);
      } else {
        toast.error("เกิดข้อผิดพลาดในการแก้ไขโพสต์");
      }
    } catch (error) {
      console.error("Error updating post:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขโพสต์");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-200 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold mb-4 text-black">แก้ไขโพสต์</h1>
        <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/post-activity/post/${post?.id}`)} // สำหรับหน้า edit โพสต์
            >
            ยกเลิก
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* หัวข้อ */}
        <div>
          <label className="block text-sm mb-1 font-medium text-black">หัวข้อ</label>
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
          <label className="block text-sm mb-1 font-medium text-black">เนื้อหา</label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
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
            <img src={preview} alt="Preview" className="mt-2 w-full h-auto rounded" />
          )}
        </div>
        <Button className="w-full" type="submit">บันทึกการแก้ไข</Button>
      </form>
    </div>
  );
}
