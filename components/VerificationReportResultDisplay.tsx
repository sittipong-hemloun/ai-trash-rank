// File: /Users/sittiponghemloun/Developer/my_project/ai-trash-rank/components/VerificationReportResultDisplay.tsx

import React from 'react';
import Image from 'next/image'; // ตรวจสอบให้แน่ใจว่าได้ import Image จาก 'next/image'

/**
 * สถานะการตรวจสอบจาก useVerification
 * - 'idle'
 * - 'verifying'
 * - 'success'
 * - 'failure'
 */
type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failure';

/**
 * รูปแบบข้อมูลผลลัพธ์การตรวจสอบ (โหมดรายงาน)
 * จาก useVerification.ts
 */
interface VerificationResult {
  trashType?: string;  // อาจเป็น "พลาสติก, กระดาษ" ก็ได้
  quantity?: string;
  confidence: number;
}

/**
 * Props ที่รับเข้ามาในคอมโพเนนท์
 */
interface VerificationReportResultDisplayProps {
  verificationStatus: VerificationStatus;
  verificationResult: VerificationResult | null;
}

/**
 * กำหนดประเภทขยะสำหรับแต่ละถังขยะ
 */
const binMappings: { [key: string]: { binName: string; binImage: string } } = {
  // สีเหลือง คือ ขยะพลาสติกและโลหะ
  'yellow': {
    binName: 'ถังขยะสีเหลือง',
    binImage: 'https://scontent.fbkk13-1.fna.fbcdn.net/v/t1.15752-9/470050728_899743485646723_426340205390854612_n.png?_nc_cat=105&ccb=1-7&_nc_sid=9f807c&_nc_ohc=VzrLnDPCnZUQ7kNvgH7318J&_nc_oc=AdjFgDAF2yaRaxjqersyRrSq7HeS0peD-AfoQbz4h0z7FwtlmjLCmFoJ71JCyFKpzU_AK6Dl9pJUFgkzATqjYBmg&_nc_zt=23&_nc_ht=scontent.fbkk13-1.fna&oh=03_Q7cD1gFOlLT3t5Pb_RvSP7PLKDRwCFNj8iyCHFzNaRS2mJGHfg&oe=67964A4F',
  },
  // สีน้ำเงิน คือ ขยะกระดาษและการ์ดบอร์ด
  'blue': {
    binName: 'ถังขยะสีน้ำเงิน',
    binImage: 'https://scontent.fbkk12-5.fna.fbcdn.net/v/t1.15752-9/470051893_483727127655693_4674345092553531578_n.png?_nc_cat=110&ccb=1-7&_nc_sid=9f807c&_nc_ohc=HPiZVBBN05oQ7kNvgF-s8Fh&_nc_oc=AdhGGbFztbxYqOKc8iEykm4HHLI_cV5yQn2XvtMa6aEz88YDawHkT4Ep2bugPcEHqMM4RGfnrxPcw24_Z4HWJhxR&_nc_zt=23&_nc_ht=scontent.fbkk12-5.fna&oh=03_Q7cD1gEzV99yx4g7-OQktDe5yHOv5AJTh4JbHgWZXSX93BA0vQ&oe=67964197',
  },
  // สีเขียว คือ ขยะเปียก
  'green': {
    binName: 'ถังขยะสีเขียว',
    binImage: 'https://scontent.fbkk12-4.fna.fbcdn.net/v/t1.15752-9/470050526_941317574626915_3771105214034255334_n.png?_nc_cat=103&ccb=1-7&_nc_sid=9f807c&_nc_ohc=GHaOEYjSU2wQ7kNvgFur6bq&_nc_oc=AdgHc2J6pGVn-PfYO6CpmMFKPaO8PGwNFao_Oy71WO4ERwZ6OJsStzGLzxm8qWktxNsRQ0eZ5HKab7VA_7DPAyYx&_nc_zt=23&_nc_ht=scontent.fbkk12-4.fna&oh=03_Q7cD1gFamZVRPPrSvk0981DWyj4z1kPLkiPxZqQGgEjrZKE_Vw&oe=679630CE',
  },
  // สีแดง คือ ขยะอันตราย
  'red': {
    binName: 'ถังขยะสีแดง',
    binImage: 'https://scontent.fbkk13-2.fna.fbcdn.net/v/t1.15752-9/470053517_589122577214327_2128935287145319928_n.png?_nc_cat=107&ccb=1-7&_nc_sid=9f807c&_nc_ohc=wlBYamZl6gAQ7kNvgFpiepO&_nc_oc=Adi3CCAoi2ec36JNrVukPJaB8cy44szO8mM27Q_1Ee4ZfxJ_1rK6h1kxUiQOAo8SQ8cIzeIvduv5MoRWRso3SsBT&_nc_zt=23&_nc_ht=scontent.fbkk13-2.fna&oh=03_Q7cD1gEpyvs9RhXrs8lmoJmHec0oKTIMz9pGAQ0BftwxSLDE0A&oe=67966301',
  },
  // ถังขยะทั่วไป (Fallback)
  'general': {
    binName: 'ถังขยะทั่วไป',
    binImage: 'https://scontent.fbkk12-5.fna.fbcdn.net/v/t1.15752-9/470051893_483727127655693_4674345092553531578_n.png?_nc_cat=110&ccb=1-7&_nc_sid=9f807c&_nc_ohc=HPiZVBBN05oQ7kNvgF-s8Fh&_nc_oc=AdhGGbFztbxYqOKc8iEykm4HHLI_cV5yQn2XvtMa6aEz88YDawHkT4Ep2bugPcEHqMM4RGfnrxPcw24_Z4HWJhxR&_nc_zt=23&_nc_ht=scontent.fbkk12-5.fna&oh=03_Q7cD1gEzV99yx4g7-OQktDe5yHOv5AJTh4JbHgWZXSX93BA0vQ&oe=67964197',
  },
};

/**
 * ฟังก์ชันแม็ปประเภทขยะ -> ชื่อถังขยะ -> รูปถังขยะ
 * โดยใช้เฉพาะ 4 สี: เหลือง, น้ำเงิน, แดง, เขียว
 */
function getBinInfo(trashType: string) {
  const lower = trashType.toLowerCase();

  // กำหนดประเภทขยะสำหรับแต่ละถังขยะ
  const yellowTrash = [
    'พลาสติก', 'โลหะ', 'ขวดพลาสติก', 'ฝาปิดพลาสติก', 'ขวดน้ำ',
    'ขวดเครื่องดื่ม', 'กล่องพลาสติก', 'ซองพลาสติก', 'ฝาขวด',
    'เหล็ก', 'อลูมิเนียม', 'กระป๋อง', 'กระป๋องดื่ม', 'ฝาปิดกระป๋อง',
    'ขวดน้ำมัน', 'หัวฉีดน้ำยา', 'ซองบรรจุภัณฑ์', 'หม้อหุงข้าวพลาสติก',
    'หลอดพลาสติก', 'บรรจุภัณฑ์พลาสติก'
  ];

  const blueTrash = [
    'กระดาษ', 'การ์ดบอร์ด', 'หนังสือ', 'นิตยสาร', 'แผ่นกระดาษ',
    'เอกสาร', 'กล่องกระดาษ', 'ซองจดหมาย', 'กระดาษแข็ง', 'สมุดโน้ต',
    'ป้ายโฆษณา', 'ใบปลิว', 'กล่องบรรจุภัณฑ์', 'กระดาษทำความสะอาด',
    'กล่องสินค้า', 'บรรจุภัณฑ์อาหารกระดาษ', 'โปสเตอร์', 'กล่องอาหาร',
    'กระดาษหนังสือพิมพ์', 'ผ้าขนหนูกระดาษ'
  ];

  const greenTrash = [
    'แก้ว', 'ขวด', 'เศษอาหาร', 'เศษกระดาษ', 'พืช', 'ผลไม้',
    'ผัก', 'เปลือกผลไม้', 'ซากพืช', 'หญ้า', 'เศษไม้',
    'ซากพืชสวน', 'เศษดิน', 'พันธุ์ไม้', 'ซากพืชผลไม้', 'ซากการทำสวน',
    'ใบไม้', 'กิ่งไม้', 'เศษดอกไม้', 'ซากผลไม้', 'ซากพืชผัก'
  ];

  const redTrash = [
    'อันตราย', 'ขยะอันตราย', 'พวกสารเคมี', 'แบตเตอรี่', 'หลอดฟลูออโรสเซนส์',
    'ยาเสพติด', 'สารละลาย', 'สารพิษ', 'น้ำยาทำความสะอาด', 'สารเคมีในรถยนต์',
    'ยาฆ่าแมลง', 'สารชีวภาพ', 'สารเคมีในงานอุตสาหกรรม', 'ยาทั่วไป',
    'สารหล่อลื่น', 'สารเคมีในเครื่องสำอาง', 'สารกันบูด', 'น้ำมันเชื้อเพลิง',
    'สารเคมีทางการเกษตร', 'สารอินทรีย์', 'สารพิษในขยะพิเศษ'
  ];

  // ตรวจสอบประเภทขยะแต่ละประเภท
  if (yellowTrash.some(trash => lower.includes(trash))) {
    return binMappings['yellow'];
  } else if (blueTrash.some(trash => lower.includes(trash))) {
    return binMappings['blue'];
  } else if (greenTrash.some(trash => lower.includes(trash))) {
    return binMappings['green'];
  } else if (redTrash.some(trash => lower.includes(trash))) {
    return binMappings['red'];
  }

  // fallback ถ้าไม่แม็ปกับอะไรที่กำหนดไว้
  return binMappings['blue'];
}

/**
 * คอมโพเนนท์แสดงผลการตรวจสอบขยะ (โหมดรายงาน)
 * เพิ่มการรองรับกรณีมีขยะหลายประเภท
 */
const VerificationReportResultDisplay: React.FC<VerificationReportResultDisplayProps> = ({
  verificationStatus,
  verificationResult,
}) => {
  // ถ้าเป็น 'idle' ยังไม่ทำอะไร
  if (verificationStatus === 'idle') {
    return null;
  }

  // กำลังตรวจสอบ
  if (verificationStatus === 'verifying') {
    return (
      <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <p>กำลังตรวจสอบ...</p>
      </div>
    );
  }

  // การตรวจสอบล้มเหลว
  if (verificationStatus === 'failure') {
    return (
      <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
        <p>การตรวจสอบล้มเหลว กรุณาลองใหม่</p>
      </div>
    );
  }

  // กรณี 'success'
  if (verificationResult) {
    // แยก trashType ด้วยเครื่องหมาย ',' ออกเป็นอาร์เรย์
    // เช่น "พลาสติก, กระดาษ" -> ["พลาสติก", "กระดาษ"]
    const trashTypesArray = verificationResult.trashType
      ? verificationResult.trashType.split(',').map((t) => t.trim())
      : [];

    return (
      <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
        <p className="text-xl font-semibold mb-2">ตรวจสอบสำเร็จ!</p>
        <p className="text-gray-700 mb-1">ปริมาณ: {verificationResult.quantity || '-'}</p>
        <p className="text-gray-700 mb-4">
          ความแม่นยำ: {(verificationResult.confidence * 100).toFixed(2)}%
        </p>

        {/* ถ้ามีหลายประเภท จะแสดง Grid */}
        {trashTypesArray.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-medium mb-4">คำแนะนำในการทิ้งขยะ:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {trashTypesArray.map((type, index) => {
                const { binName, binImage } = getBinInfo(type);
                return (
                  <div
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-md flex flex-col items-center"
                  >
                    <div className="mb-4">
                      {/* ใช้ Image จาก next/image */}
                      <Image
                        src={binImage}
                        alt={binName}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-center">
                      {/* ขยะประเภทที่ AI ตรวจพบ */}
                      <span className="block font-semibold text-gray-700 mb-1">
                        ขยะประเภท: {type}
                      </span>
                      {/* แสดงถังที่เหมาะสม */}
                      <span className="text-gray-600">{binName}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* กรณีไม่มี trashType หรือมีปัญหา */}
        {trashTypesArray.length === 0 && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <p className="font-medium">คำแนะนำ:</p>
            <p>ไม่สามารถระบุประเภทขยะได้ กรุณาตรวจสอบด้วยตนเอง</p>
          </div>
        )}
      </div>
    );
  }

  // เผื่อกรณีไม่เข้าเงื่อนไขใด ๆ
  return null;
};

export default VerificationReportResultDisplay;