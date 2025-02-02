// File: /Users/sittiponghemloun/Developer/my_project/ai-trash-rank/components/VerificationReportResultDisplay.tsx

import React from 'react';
import Image from 'next/image';
import YellowBinImg from '../public/images/เหลือง.png';
import BlueBinImg from '../public/images/น้ำเงิน.png';
import GreenBinImg from '../public/images/เขียว.png';
import RedBinImg from '../public/images/แดง.png';

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
  isThereTrash?: boolean;
  trashType?: string;  // อาจเป็น "พลาสติก, กระดาษ" ก็ได้
  quantity?: string;
  materials?: { material: string; binType: string }[];
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
    binImage: YellowBinImg.src,
  },
  // สีน้ำเงิน คือ ขยะกระดาษและการ์ดบอร์ด
  'blue': {
    binName: 'ถังขยะสีน้ำเงิน',
    binImage: BlueBinImg.src,
  },
  // สีเขียว คือ ขยะเปียก
  'green': {
    binName: 'ถังขยะสีเขียว',
    binImage: GreenBinImg.src,
  },
  // สีแดง คือ ขยะอันตราย
  'red': {
    binName: 'ถังขยะสีแดง',
    binImage: RedBinImg.src,
  },
  // ถังขยะทั่วไป (Fallback)
  'general': {
    binName: 'ถังขยะทั่วไป',
    binImage: BlueBinImg.src,
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
    // const trashTypesArray = verificationResult.trashType
    //   ? verificationResult.trashType.split(',').map((t) => t.trim())
    //   : [];

    const materials = verificationResult.materials || [];
    const binInfo = materials.map((m) => getBinInfo(m.material));

    return (
      <>
        {verificationResult.isThereTrash && binInfo.length > 1 && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
            <p className="text-xl font-semibold mb-2">ตรวจสอบสำเร็จ!</p>
            <p className="text-gray-700 mb-1">ปริมาณ: {verificationResult.quantity || '-'}</p>
            <p className="text-gray-700 mb-4">
              ความแม่นยำ: {(verificationResult.confidence * 100).toFixed(2)}%
            </p>

            {/* ถ้ามีหลายประเภท จะแสดง Grid */}

            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <p className="font-medium mb-4">คำแนะนำในการทิ้งขยะ:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {binInfo.map((info, index) => (
                  <div
                    key={index}
                    className="p-4 bg-white border border-gray-200 rounded-md flex flex-col items-center"
                  >
                    <div className="mb-4">
                      <Image
                        src={info.binImage}
                        alt={info.binName}
                        width={64}
                        height={64}
                        className="object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <span className="block font-semibold text-gray-700 mb-1">
                        วัสดุ: {materials[index].material}
                      </span>
                      <span className="text-gray-600">{info.binName}</span>
                    </div>
                  </div>
                ))

                }
              </div>
            </div>

          </div>


        )
        }

        {verificationResult.isThereTrash === false && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p>ไม่พบขยะในรูปภาพ</p>
          </div>

        )
        }



      </>
    );
  }

  // เผื่อกรณีไม่เข้าเงื่อนไขใด ๆ
  return null;
};

export default VerificationReportResultDisplay;