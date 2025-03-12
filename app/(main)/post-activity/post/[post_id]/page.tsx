/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import React from "react";
import { getPostById } from "@/utils/db/actions";
import { useEffect, useState } from "react";
import useUser from "@/hooks/useUser";
import toast from "react-hot-toast";
import { deletePost } from "@/utils/db/actions";

interface Post {
  id: number;
  name: string;
  content: string;
  image: string | null;
  createdAt: Date;
  userId: number;
}

export default function PostActivityPage() {
  const { post_id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const fetchPost = async () => {
      const postData = await getPostById(Number(post_id));
      setPost(postData);
    };
    fetchPost();
  }, [post_id]);

  // ฟังก์ชันสำหรับแก้ไขโพสต์
  const handleEditPost = () => {
    router.push(`/post-activity/post/${post?.id}/edit`);
  };

  // ฟังก์ชันสำหรับลบโพสต์
  const handleDeletePost = async () => {
    if (!post) return;
    const confirmDelete = confirm("คุณแน่ใจหรือไม่ที่จะลบโพสต์นี้?");
    if (!confirmDelete) return;
    const success = await deletePost(post.id);
    if (success) {
      toast.success("ลบโพสต์สำเร็จ");
      router.push("/post-activity");
    } else {
      toast.error("เกิดข้อผิดพลาดในการลบโพสต์");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-200 rounded-2xl">
      <div className="flex items-center justify-between mb-4">
        {user && post && user.id === post.userId ? (
          <div className="flex space-x-2 mb-4">
            <button
              onClick={handleEditPost}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
            >
              แก้ไขโพสต์
            </button>
            <button
              onClick={handleDeletePost}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md"
            >
              ลบโพสต์
            </button>
          </div>
        ) : (
          <div />
        )}
        <button
          onClick={() => router.push("/post-activity")}
          className="bg-green-500 text-white px-4 py-2 rounded-md ml-auto"
        >
          ย้อนกลับ
        </button>
      </div>
      <h3 className="text-xl text-black mb-2 font-semibold break-words">
        {post?.name}
      </h3>
      {post?.image && (
        <img
          src={post.image}
          alt={post.name}
          className="w-full h-64 object-contain mb-4 rounded-md"
        />
      )}
      <p className="mb-2 break-words">{post?.content}</p>
      <p className="mb-2">
        วันที่โพส: {post ? new Date(post.createdAt).toLocaleDateString() : ""}
      </p>
    </div>
  );
}