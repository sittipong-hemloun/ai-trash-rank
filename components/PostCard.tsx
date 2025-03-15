/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect } from "react";
import { getLikes, getComments, addLike, addComment } from "@/utils/db/actions";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import useUser from "@/hooks/useUser";

interface Post {
  id: number;
  name: string;
  userName: string;
  userProfileImage: string | null;
  image: string | null;
  content: string;
  userId: number;
  createdAt: Date;
}

interface Comment {
  id: number;
  createdAt: Date;
  userId: number;
  userName: string;
  userProfileImage: string | null;
  content: string;
  targetType: string;
  targetId: number;
}

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const router = useRouter();
  const { user } = useUser();
  const currentUserId = user?.id;

  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const likesData = await getLikes("post", post.id);
        const commentsData = await getComments("post", post.id);
        setLikesCount(likesData.length);
        setCommentsCount(commentsData.length);
        setComments(commentsData);
      } catch (error) {
        console.error("Error fetching counts:", error);
      }
    };
    fetchCounts();
  }, [post.id]);

  const handleLike = async (postID: number) => {
    if (!currentUserId) {
      alert("กรุณาเข้าสู่ระบบก่อนกดไลค์");
      return;
    }
    try {
      const likeResponse = await addLike(currentUserId, "post", postID);
      if (!likeResponse) {
        alert("เกิดข้อผิดพลาดในการกดไลค์");
        return;
      }
      const likesData = await getLikes("post", postID);
      setLikesCount(likesData.length);
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleCommentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUserId) {
      alert("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
      return;
    }
    if (!commentInput.trim()) return;
    try {
      await addComment(
        currentUserId,
        user.name,
        user.profileImage,
        "post",
        post.id,
        commentInput
      );
      const commentsData = await getComments("post", post.id);
      setCommentsCount(commentsData.length);
      setComments(commentsData);
      setCommentInput("");
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  const toggleComments = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowComments((prev) => !prev);
  };

  return (
    <div
      key={post.id}
      className="bg-white shadow rounded-lg p-4 mb-6 hover:shadow-lg transition-shadow"
    >
      <div onClick={() => router.push(`/post-activity/post/${post.id}`)} className="cursor-pointer">
        <div className="flex items-center mb-4">
          <img
            src={post.userProfileImage || "/user.png"}
            alt="User"
            className="w-10 h-10 rounded-full"
          />
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">{post.userName}</h3>
            <p className="text-xs text-gray-500">
              {new Date(post.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <h3 className="text-gray-800 mb-4 text-2xl">{post.name}</h3>
        {post.image && (
          <img
            src={post.image}
            alt={post.name}
            className="w-full h-auto object-cover rounded mb-4"
          />
        )}
        <p className="text-gray-800 mb-4">{post.content}</p>
      </div>
      <div className="flex justify-around border-t pt-2">
        <button
          onClick={() => handleLike(post.id)}
          className="text-blue-500 hover:text-blue-600 text-sm cursor-pointer"
        >
          {likesCount > 0 ? `Like (${likesCount})` : "Like"}
        </button>
        <button
          onClick={toggleComments}
          className="text-blue-500 hover:text-blue-600 text-sm"
        >
          {commentsCount > 0 ? `Comment (${commentsCount})` : "Comment"}
        </button>
      </div>
      {showComments && (
        <>
          <div className="mt-4 space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} className="flex items-start space-x-2">
                <img
                  src={comment.userProfileImage || "/user.png"}
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <p className="text-sm font-semibold">{comment.userName}</p>
                  <p className="text-sm">{comment.content}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={handleCommentSubmit} className="mt-4 flex space-x-2">
            <input
              type="text"
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="เขียนความคิดเห็น..."
              className="flex-1 border rounded px-3 focus:outline-none focus:ring"
            />
            <Button type="submit">ส่ง</Button>
          </form>
        </>
      )}
    </div>
  );
};

export default PostCard;