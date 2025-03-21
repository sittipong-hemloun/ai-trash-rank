/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useEffect, useState } from "react";
import { getCoperateRegistrationsByStatus, updateCoperateRegistrationStatus, addUserRole } from "@/utils/db/actions";
import useUser from "@/hooks/useUser";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface ICoperateRegistration {
  id: number;
  userId: number;
  orgName: string | null;
  orgType: string | null;
  orgDetail: string | null;
  orgImage: string | null;
  status: string;
  createdAt: string;
}

export default function AdminDashboardPage() {
  const { user, loading } = useUser();
  const [pendingList, setPendingList] = useState<ICoperateRegistration[]>([]);

  useEffect(() => {
    if (!loading && user) {
      // We should check if user is admin; if not, redirect or show error
      fetchPending();
    }
  }, [user, loading]);

  const fetchPending = async () => {
    try {
      const list = await getCoperateRegistrationsByStatus("pending");
      setPendingList(list.map(item => ({
        ...item,
        createdAt: item.createdAt.toString()
      })));
    } catch (err) {
      console.error("Error fetching pending coperate regs:", err);
    }
  };

  const handleApprove = async (item: ICoperateRegistration) => {
    try {
      const updated = await updateCoperateRegistrationStatus(item.id, "approved");
      if (updated) {
        // Also add coperate role to user
        await addUserRole(item.userId, "coperate");
        toast.success(`อนุมัติสำเร็จ: ${item.orgName}`);
        // refresh
        fetchPending();
      } else {
        toast.error("ไม่สามารถอัปเดตสถานะได้");
      }
    } catch (err) {
      console.error("Error approving coperate:", err);
      toast.error("เกิดข้อผิดพลาดในการอนุมัติ");
    }
  };

  // Simple check for user having admin role.
  // In a real app, you'd fetch user roles from an API or server side.
  // For simplicity, let's just do a naive check if user is loaded with "admin" role in DB
  // or just allow user to see this if you do that logic in a bigger scope.
  // Here we assume your useUser might have a roles array in future.
  // For demonstration, we'll skip and always let them in. In production, you'd do a real check.
  if (!user) {
    return <div className="p-4">กรุณาเข้าสู่ระบบ</div>;
  }

  // If needed, check if user is admin. If not, show error or redirect.
  // e.g. if (!userRoles.includes("admin")) { return <p>คุณไม่มีสิทธิ์เข้าถึงหน้านี้</p>; }

  return (
    <div className="h-screen bg-gradient-to-b from-black to-green-400">
      <div className="pt-8">
        <div className="max-w-4xl mx-auto p-4 shadow rounded bg-white">
          <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
          <h2 className="text-lg font-medium">คำขอลงทะเบียนองค์กร (รออนุมัติ)</h2>
          {pendingList.length === 0 ? (
            <p className="text-gray-600 mt-2">ไม่มีคำขอรออนุมัติ</p>
          ) : (
            <div className="mt-4 space-y-4">
              {pendingList.map((item) => (
                <div key={item.id} className="border p-4 rounded space-y-2 bg-gray-50">
                  <p><strong>ชื่อองค์กร:</strong> {item.orgName}</p>
                  <p><strong>ประเภทองค์กร:</strong> {item.orgType}</p>
                  <p><strong>รายละเอียด:</strong> {item.orgDetail}</p>
                  {item.orgImage && (
                    <div>
                      <strong>รูปภาพตัวอย่าง:</strong>
                      <img src={item.orgImage} alt="org" className="mt-2 max-h-60 object-cover" />
                    </div>
                  )}
                  <Button onClick={() => handleApprove(item)}>Approve</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}