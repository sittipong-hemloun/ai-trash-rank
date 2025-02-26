/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams } from "next/navigation";
import React from "react";
import { getPostById } from "@/utils/db/actions";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Post {
  id: number;
  name: string;
  content: string;
  image: string;
  createdAt: Date;
}

export default function PostActivityPage() {
  const { post_id } = useParams();
  const [post, setPost] = useState<Post | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPost = async () => {
      const post = await getPostById(Number(post_id));
      setPost(post);
    };
    fetchPost();
  }, [post_id]);

  return (
    <div>
      <div className="max-w-2xl mx-auto p-6 bg-gray-200 rounded-2xl">
        <div className="clearfix mb-4">
          <button
              onClick={() => router.push("/post-activity")}
              className="bg-green-500 text-white px-4 py-2 rounded-md float-right">
              ย้อนกลับ
          </button>
        <h3 className="text-xl text-black mb-2 break-words">
          {post?.name}
        </h3>
        </div>
        <img
          src={post?.image}
          alt={post?.name}
          className="w-full h-auto mb-4 rounded-md"
        />
        <p className="mb-2 break-words">{post?.content}</p>
        <p className="mb-2">
          วันที่โพส: {post?.createdAt.toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
