/* eslint-disable @next/next/no-img-element */
"use client";
import React, { useState, useEffect } from "react";
import { getAllPosts, getAllActivities } from "@/utils/db/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import { Loader2 } from "lucide-react";
import PostCard from "@/components/PostCard";
import ActivityCard from "@/components/ActivityCard";

const ITEMS_PER_PAGE = 5;

export default function PostActivityPage() {
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