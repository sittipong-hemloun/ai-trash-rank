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

  const handleEditPost = () => {
    router.push(`/post-activity/post/${post?.id}/edit`);
  };

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
    <div className="max-w-2xl mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        {user && post && user.id === post.userId ? (
          <div className="flex space-x-2">
            <button
              onClick={handleEditPost}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              แก้ไขโพสต์
            </button>
            <button
              onClick={handleDeletePost}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md transition-colors"
            >
              ลบโพสต์
            </button>
          </div>
        ) : (
          <div />
        )}
        <button
          onClick={() => router.push("/post-activity")}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md transition-colors"
        >
          ย้อนกลับ
        </button>
      </div>

      <h3 className="text-2xl text-gray-800 font-semibold break-words mb-4">
        {post?.name}
      </h3>

      {carouselImages.length > 0 && (
        <div className="mb-4">
          <Carousel showThumbs={false} autoPlay infiniteLoop>
            {carouselImages.map((img) => (
              <div key={img.id}>
                <img
                  src={img.url}
                  alt="Post image"
                  className="w-full h-64 object-contain rounded-md shadow-sm"
                />
              </div>
            ))}
          </Carousel>
        </div>
      )}

      <p className="mb-4 text-gray-700 leading-relaxed break-words">
        {post?.content}
      </p>
      <p className="text-sm text-gray-500">
        วันที่โพส: {post ? new Date(post.createdAt).toLocaleDateString() : ""}
      </p>
    </div>
  );
}