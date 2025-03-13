/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPostById, getPostImagesByPostId, deletePost } from "@/utils/db/actions";
import toast from "react-hot-toast";
import useUser from "@/hooks/useUser";
import "react-responsive-carousel/lib/styles/carousel.min.css";
import { Carousel } from "react-responsive-carousel";

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

export default function PostActivityPage() {
  const { post_id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const [postImages, setPostImages] = useState<PostImage[]>([]);
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    const fetchPost = async () => {
      const postData = await getPostById(Number(post_id));
      setPost(postData);
      if (postData) {
        const images = await getPostImagesByPostId(postData.id);
        setPostImages(images);
      }
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

  // Combine featured image and additional images for Carousel
  const carouselImages = [];
  if (post?.image) {
    carouselImages.push({ id: "featured", url: post.image });
  }
  if (postImages.length > 0) {
    carouselImages.push(...postImages);
  }

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
      {carouselImages.length > 0 && (
        <Carousel showThumbs={false} autoPlay infiniteLoop>
          {carouselImages.map((img) => (
            <div key={img.id}>
              <img src={img.url} alt="Post image" className="w-full h-64 object-contain rounded-md" />
            </div>
          ))}
        </Carousel>
      )}
      <p className="mb-2 break-words">{post?.content}</p>
      <p className="mb-2">
        วันที่โพส: {post ? new Date(post.createdAt).toLocaleDateString() : ""}
      </p>
    </div>
  );
}