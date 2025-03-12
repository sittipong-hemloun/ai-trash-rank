/* eslint-disable @next/next/no-img-element */
// app/post-activity/page.tsx
"use client";

import { useState, useEffect } from "react";
import { getAllPosts, getAllActivities } from "@/utils/db/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Pagination from "@/components/Pagination";
import { Loader2 } from "lucide-react";

const ITEMS_PER_PAGE = 8;

export default function PostActivityPage() {
  const router = useRouter();
  interface Post {
    id: number;
    name: string;
    image: string | null;
    content: string;
    userId: number;
    createdAt: Date;
  }

  interface Activity {
    id: number;
    name: string;
    image: string | null;
    createdAt: Date;
    userId: number;
  }

  const [posts, setPosts] = useState<Post[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<"posts" | "activities">("posts");
  const [isLoading, setIsLoading] = useState(true);

  const handleTabChange = (tab: "posts" | "activities") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      const postsData = await getAllPosts();
      const activitiesData = await getAllActivities();
      setPosts(postsData);
      setActivities(activitiesData);
      setIsLoading(false);
    };
    fetchData();
    // setIsLoading(false)
  }, [activeTab]);

  // Calculate pagination details
  const postsPageCount = Math.ceil(posts.length / ITEMS_PER_PAGE);
  const activitiesPageCount = Math.ceil(activities.length / ITEMS_PER_PAGE);

  // Get current items based on active tab
  const paginatedPosts = posts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const paginatedActivities = activities.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="p-6 max-w-4xl mx-auto ">
      <h1 className="text-3xl font-semibold mb-6 text-gray-200">
        ข่าวสารและกิจกรรม
      </h1>

      <div className="w-full space-x-3 mb-6">
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

        <Link href="/post-activity/create">
          <Button className="float-right">เพิ่ม</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="w-10 h-10 animate-spin text-white" />
        </div>
      ) : (
        <>
          {/* Posts Section */}
          {activeTab === "posts" && (
            <section className="mb-8 ">
              {paginatedPosts.length === 0 ? (
                <p className="text-white">ไม่พบข่าวสาร</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 ">
                  {paginatedPosts.map((post) => (
                    <div
                      key={post.id}
                      className="p-4 rounded-md shadow border border-gray-200 bg-gray-200 cursor-pointer"
                      onClick={() =>
                        router.push(`/post-activity/post/${post.id}`)
                      }
                    >
                      {post.image && (
                        <img
                          src={post.image}
                          alt={post.name}
                          className="w-full h-40 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="text-s text-black mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        {post.name}
                      </h3>
                      {/* <p className="text-white mb-1">{post.content}</p> */}
                      <p className="text-xs text-black">
                        วันที่โพส:{" "}
                        {new Date(post.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={postsPageCount}
                onPrevious={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                onNext={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, postsPageCount))
                }
              />
            </section>
          )}

          {/* Activities Section */}
          {activeTab === "activities" && (
            <section>
              {paginatedActivities.length === 0 ? (
                <p className="text-white">ไม่พบกิจกรรม</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {paginatedActivities.map((activity) => (
                    <div
                      key={activity.id}
                      className="p-4 rounded-md shadow border border-gray-200 bg-gray-200 cursor-pointer"
                      onClick={() =>
                        router.push(`/post-activity/activity/${activity.id}`)
                      }
                    >
                      {activity.image && (
                        <img
                          src={activity.image}
                          alt={activity.name}
                          className="w-full h-40 object-cover rounded mb-2"
                        />
                      )}
                      <h3 className="text-s text-black mb-2 overflow-hidden text-ellipsis whitespace-nowrap">
                        {activity.name}
                      </h3>
                      <p className="text-xs text-gray-500">
                        วันที่โพส:{" "}
                        {new Date(activity.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
              {/* Pagination Controls */}
              <Pagination
                currentPage={currentPage}
                totalPages={activitiesPageCount}
                onPrevious={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                onNext={() =>
                  setCurrentPage((prev) =>
                    Math.min(prev + 1, activitiesPageCount)
                  )
                }
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
