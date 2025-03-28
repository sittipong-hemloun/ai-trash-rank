/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getPostById,
  updatePost,
  getPostImagesByPostId,
  createPostImage
} from "@/utils/db/actions";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";

interface Post {
  id: number;
  name: string;
  content: string;
  image: string | null;
  createdAt: Date;
  userId: number;
}

interface PostImage {
  id: number;
  postId: number;
  url: string;
  createdAt: Date;
}

export default function EditPostPage() {
  const { post_id } = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");

  // States for additional images
  const [existingAdditionalImages, setExistingAdditionalImages] = useState<PostImage[]>([]);
  const [newAdditionalImages, setNewAdditionalImages] = useState<File[]>([]);
  const [newAdditionalImagesPreview, setNewAdditionalImagesPreview] = useState<string[]>([]);

  useEffect(() => {
    const fetchPost = async () => {
      const postData = await getPostById(Number(post_id));
      if (postData) {
        setPost(postData);
        setTitle(postData.name);
        setContent(postData.content);
        setPreview(postData.image || "");
        const additionalImgs = await getPostImagesByPostId(postData.id);
        setExistingAdditionalImages(additionalImgs);
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

  const handleNewAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setNewAdditionalImages((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setNewAdditionalImagesPreview((prevPreviews) => [
          ...prevPreviews,
          reader.result as string,
        ]);
      };
      reader.readAsDataURL(file);
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
      const updated = await updatePost(post.id, title, content, imageString || undefined);
      if (updated) {
        // Upload new additional images if any
        if (newAdditionalImages.length > 0) {
          for (const file of newAdditionalImages) {
            const base64 = await fileToBase64(file);
            await createPostImage(post.id, base64);
          }
        }
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
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">แก้ไขโพสต์</h1>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/post-activity/post/${post?.id}`)}
        >
          ยกเลิก
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* หัวข้อ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หัวข้อ
          </label>
          <input
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        {/* เนื้อหา */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            เนื้อหา
          </label>
          <textarea
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        {/* อัปโหลดรูปหลัก */}
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            อัปโหลดรูปหลัก
          </label>
          <label
            htmlFor="verification-image"
            className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 border border-gray-200 p-2"
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
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-2 w-full h-64 object-contain rounded-md shadow-sm"
            />
          )}
        </div>
        {/* แสดงรูปภาพรองที่มีอยู่ */}
        {existingAdditionalImages.length > 0 && (
          <div>
            <p className="text-gray-800 font-semibold mt-4">รูปภาพรองที่มีอยู่</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {existingAdditionalImages.map((img) => (
                <img
                  key={img.id}
                  src={img.url}
                  alt="existing additional"
                  className="w-full h-64 object-contain rounded-md shadow-sm"
                />
              ))}
            </div>
          </div>
        )}
        {/* เพิ่มรูปภาพรองใหม่ */}
        <div>
          <p className="text-gray-800 font-semibold mt-4">
            เพิ่มรูปภาพรองใหม่ (เพิ่มเติม)
          </p>
          <label
            htmlFor="edit-post-additional-images"
            className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 border border-gray-200 p-2"
          >
            เลือกไฟล์
            <input
              id="edit-post-additional-images"
              name="edit-post-additional-images"
              type="file"
              className="sr-only"
              onChange={handleNewAdditionalImagesChange}
              accept="image/*"
              multiple
            />
          </label>
          {newAdditionalImagesPreview.length > 0 && (
            <div className="grid grid-cols-3 gap-2 mt-2">
              {newAdditionalImagesPreview.map((previewUrl, idx) => (
                <img
                  key={idx}
                  src={previewUrl}
                  alt="new additional preview"
                  className="w-full h-64 object-contain rounded-md shadow-sm"
                />
              ))}
            </div>
          )}
        </div>
        <Button className="w-full" type="submit">
          บันทึกการแก้ไข
        </Button>
      </form>
    </div>
  );
}