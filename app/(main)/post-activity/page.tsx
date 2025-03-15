/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect } from "react";
import { getAllPosts, getAllActivities, addLike, addComment, getLikes, getComments } from "@/utils/db/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";
import { Loader2 } from "lucide-react";
import useUser from "@/hooks/useUser"; // Import the useUser hook

const ITEMS_PER_PAGE = 5;

export default function PostActivityPage() {
  // Define types for Posts and Activities
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

  interface Activity {
    id: number;
    name: string;
    userName: string;
    userProfileImage: string | null;
    content: string;
    image: string | null;
    createdAt: Date;
    userId: number;
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

  const router = useRouter();
  const { user } = useUser(); // Get user from hook
  const currentUserId = user?.id; // Use the logged-in user's id

  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"posts" | "activities">("posts");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const postsData = await getAllPosts();
        const activitiesData = await getAllActivities();
        setPosts(postsData);
        setActivities(activitiesData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleTabChange = (tab: "posts" | "activities") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  // Pagination calculations
  const postsPageCount = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const activitiesPageCount = Math.ceil(activities.length / ITEMS_PER_PAGE);

  const paginatedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paginatedActivities = activities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Component for rendering a Post card with likes and comments counts
  const PostCard = ({ post }: { post: Post }) => {
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
        setCommentInput(""); // Clear input after submitting
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    };

    const toggleComments = (e: React.MouseEvent) => {
      e.stopPropagation();
      setShowComments((prev) => !prev);
    };

    const handleShare = (event: React.MouseEvent) => {
      event.stopPropagation();
      const url = window.location.origin + `/post-activity/post/${post.id}`;
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(shareUrl, "_blank");
    };

    return (
      <div
        key={post.id}
        className="bg-white shadow rounded-lg p-4 mb-6 hover:shadow-lg transition-shadow"
      >
        <div onClick={() => router.push(`/post-activity/post/${post.id}`)}>
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
          <p className="text-gray-800 mb-4">{post.name}</p>
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
          <button
            onClick={handleShare}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            Share
          </button>
        </div>
        {showComments && (
          <>
            {/* Render all comments */}
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
            {/* Comment input form */}
            <form
              onSubmit={handleCommentSubmit}
              className="mt-4 flex space-x-2"
            >
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



  // Component for rendering an Activity card with likes and comments counts
  const ActivityCard = ({ activity }: { activity: Activity }) => {
    const [likesCount, setLikesCount] = useState(0);
    const [commentsCount, setCommentsCount] = useState(0);
    const [commentInput, setCommentInput] = useState(""); // state for new comment

    useEffect(() => {
      const fetchCounts = async () => {
        try {
          const likesData = await getLikes("activity", activity.id);
          const commentsData = await getComments("activity", activity.id);
          setLikesCount(likesData.length);
          setCommentsCount(commentsData.length);
        } catch (error) {
          console.error("Error fetching counts:", error);
        }
      };
      fetchCounts();
    }, [activity.id]);

    const handleLike = async (event: React.MouseEvent) => {
      event.stopPropagation();
      if (!currentUserId) {
        alert("กรุณาเข้าสู่ระบบก่อนกดไลค์");
        return;
      }
      try {
        const likeResponse = await addLike(currentUserId, "activity", activity.id);
        if (!likeResponse) {
          alert("เกิดข้อผิดพลาดในการกดไลค์");
          return;
        }
        const likesData = await getLikes("activity", activity.id);
        setLikesCount(likesData.length);
      } catch (error) {
        console.error("Error toggling like:", error);
      }
    };

    // ฟังก์ชันสำหรับส่งคอมเมนต์ในกิจกรรม
    const handleCommentSubmit = async () => {
      if (!currentUserId) {
        alert("กรุณาเข้าสู่ระบบก่อนแสดงความคิดเห็น");
        return;
      }
      if (!commentInput.trim()) return;
      try {
        await addComment(currentUserId, user.name, user.profileImage, "activity", activity.id, commentInput);
        const commentsData = await getComments("activity", activity.id);
        setCommentsCount(commentsData.length);
        setCommentInput("");
      } catch (error) {
        console.error("Error adding comment:", error);
      }
    };

    const handleShare = (event: React.MouseEvent) => {
      event.stopPropagation();
      const url = window.location.origin + `/post-activity/activity/${activity.id}`;
      const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
      window.open(shareUrl, "_blank");
    };

    return (
      <div
        key={activity.id}
        className="bg-white shadow rounded-lg p-4 mb-6 cursor-pointer hover:shadow-lg transition-shadow"
        onClick={() => router.push(`/post-activity/activity/${activity.id}`)}
      >
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex-shrink-0"></div>
          <div className="ml-3">
            <h3 className="font-semibold text-gray-900">{activity.name}</h3>
            <p className="text-xs text-gray-500">
              {new Date(activity.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        {activity.image && (
          <img
            src={activity.image}
            alt={activity.name}
            className="w-full h-auto object-cover rounded mb-4"
          />
        )}
        <p className="text-gray-800 mb-4">กิจกรรม: {activity.name}</p>
        <div className="flex justify-around border-t pt-2">
          <button onClick={handleLike} className="text-blue-500 hover:text-blue-600 text-sm">
            {likesCount > 0 ? `Like (${likesCount})` : "Like"}
          </button>
          <button
            onClick={(e) => e.stopPropagation()}
            className="text-blue-500 hover:text-blue-600 text-sm"
          >
            {commentsCount > 0 ? `Comment (${commentsCount})` : "Comment"}
          </button>
          <button onClick={handleShare} className="text-blue-500 hover:text-blue-600 text-sm">
            Share
          </button>
        </div>
        {/* ช่องสำหรับเพิ่มคอมเมนต์ */}
        <form onSubmit={handleCommentSubmit} className="mt-4 flex space-x-2">
          <input
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="เขียนความคิดเห็น..."
            className="flex-1 border rounded px-3 py-2 focus:outline-none focus:ring"
          />
          <Button type="submit">ส่ง</Button>
        </form>
      </div>
    );
  };

  return (
    <div className="">
      <div className="max-w-2xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-semibold text-gray-900">ข่าวสารและกิจกรรม</h1>
          <Link href="/post-activity/create">
            <Button>เพิ่ม</Button>
          </Link>
        </div>
        <div className="mb-6 flex space-x-4">
          <Button
            variant={activeTab === "posts" ? "default" : "outline"}
            onClick={() => handleTabChange("posts")}
          >
            ข่าวสาร
          </Button>
          <Button
            variant={activeTab === "activities" ? "default" : "outline"}
            onClick={() => handleTabChange("activities")}
          >
            กิจกรรม
          </Button>
        </div>
        {isLoading ? (
          <div className="flex justify-center items-center h-60">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : (
          <div>
            {activeTab === "posts" ? (
              paginatedPosts.length === 0 ? (
                <p className="text-gray-600">ไม่พบข่าวสาร</p>
              ) : (
                paginatedPosts.map((post) => <PostCard key={post.id} post={post} />)
              )
            ) : paginatedActivities.length === 0 ? (
              <p className="text-gray-600">ไม่พบกิจกรรม</p>
            ) : (
              paginatedActivities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} />
              ))
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={activeTab === "posts" ? postsPageCount : activitiesPageCount}
              onPrevious={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              onNext={() =>
                setCurrentPage((prev) =>
                  Math.min(prev + 1, activeTab === "posts" ? postsPageCount : activitiesPageCount)
                )
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
