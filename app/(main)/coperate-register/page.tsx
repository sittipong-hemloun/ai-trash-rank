/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { createCoperateRegistration } from "@/utils/db/actions";
import useUser from "@/hooks/useUser";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

/**
 * หน้าสำหรับลงทะเบียนองค์กร
 * ข้อมูลที่ต้องกรอก:
 * 1. ชื่อองค์กร (orgName)
 * 2. ประเภทองค์กร (orgType)
 * 3. รายละเอียดองค์กร (orgDetail)
 * 4. รูปภาพ (orgImage)
 */
export default function CoperateRegisterPage() {
  const { user } = useUser();
  const router = useRouter();

  const [orgName, setOrgName] = useState("");
  const [orgType, setOrgType] = useState("");
  const [orgDetail, setOrgDetail] = useState("");
  const [orgImage, setOrgImage] = useState<File | null>(null);
  const [orgImagePreview, setOrgImagePreview] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOrgImage(file);
      const reader = new FileReader();
      reader.onload = () => setOrgImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const fileToBase64 = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("กรุณาเข้าสู่ระบบก่อน");
      return;
    }
    try {
      let imageBase64 = "";
      if (orgImage) {
        imageBase64 = await fileToBase64(orgImage);
      }

      const result = await createCoperateRegistration(
        user.id,
        orgName.trim(),
        orgType.trim(),
        orgDetail.trim(),
        imageBase64
      );
      if (result) {
        toast.success("ส่งคำขอลงทะเบียนองค์กรเรียบร้อย กรุณารอการอนุมัติจาก Admin");
        router.push("/post-activity");
      } else {
        toast.error("เกิดข้อผิดพลาดในการลงทะเบียนองค์กร");
      }
    } catch (err) {
      console.error("Error registering coperate:", err);
      toast.error("เกิดข้อผิดพลาดในการลงทะเบียนองค์กร");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 bg-white rounded-md shadow">
      <h1 className="text-xl font-semibold mb-4">ลงทะเบียนองค์กร (Coperate)</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="font-medium">ชื่อองค์กร</label>
          <input
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full border p-2 rounded mt-1"
            required
          />
        </div>
        <div>
          <label className="font-medium">ประเภทองค์กร</label>
          <input
            type="text"
            value={orgType}
            onChange={(e) => setOrgType(e.target.value)}
            className="w-full border p-2 rounded mt-1"
          />
        </div>
        <div>
          <label className="font-medium">รายละเอียดองค์กร</label>
          <textarea
            value={orgDetail}
            onChange={(e) => setOrgDetail(e.target.value)}
            className="w-full border p-2 rounded mt-1"
            rows={3}
          />
        </div>
        <div>
          <label className="font-medium">รูปภาพองค์กร</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="block w-full mt-1"
          />
          {orgImagePreview && (
            <img
              src={orgImagePreview}
              alt="Preview"
              className="mt-2 w-full h-64 object-contain"
            />
          )}
        </div>

        <div className="flex justify-between items-center mt-4">
          <Button type="submit">ส่งคำขอ</Button>
        </div>
      </form>
    </div>
  );
}