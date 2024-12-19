'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { MapPin, Upload, Loader } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { StandaloneSearchBox, useJsApiLoader } from '@react-google-maps/api';
import { Libraries } from '@react-google-maps/api';
import { createUser, getUserByEmail, createReport, getRecentReports } from '@/utils/db/actions';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// API keys for Google Maps and Generative AI
const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

// Google Maps libraries to load
const libraries: Libraries = ['places'];

export default function ReportPage() {
  const router = useRouter();

  // State
  const [user, setUser] = useState<{ id: number; email: string; name: string; point: number; score: number } | null>(null);
  const [reports, setReports] = useState<Array<{ id: number; location: string; trashType: string; amount: string; createdAt: string }>>([]);
  const [newReport, setNewReport] = useState({ location: '', type: '', amount: '' });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failure'>('idle');
  const [verificationResult, setVerificationResult] = useState<{ trashType: string; quantity: string; confidence: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchBox, setSearchBox] = useState<google.maps.places.SearchBox | null>(null);

  // Load Google Maps JavaScript API
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey,
    libraries,
  });

  // Handle Google Places Search Box
  const onLoad = useCallback((ref: google.maps.places.SearchBox) => setSearchBox(ref), []);

  // Handle changes when a place is selected from the search box
  const onPlacesChanged = useCallback(() => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places[0]) {
        setNewReport(prev => ({ ...prev, location: places[0].formatted_address || '' }));
      }
    }
  }, [searchBox]);

  // Handle input changes for text fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewReport(prev => ({ ...prev, [name]: value }));
  };

  // Handle file upload and set a preview for the image
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Convert file to Base64 string
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Extract JSON data from a response string
  const convertToJSONFormat = (text: string) => {
    // Remove code block markers and extract JSON string
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      const jsonString = text.slice(jsonStart, jsonEnd + 1);
      return jsonString;
    }
    throw new Error('Invalid JSON format');
  };

  // Handle trash verification using AI
  const handleVerify = async () => {
    if (!file) {
      toast.error('Please select a file to verify.');
      return;
    }

    setVerificationStatus('verifying');

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      // Converts the selected image file to a Base64-encoded string
      const base64Data = await readFileAsBase64(file);

      const prompt = `คุณเป็นผู้เชี่ยวชาญด้านการจัดการและการรีไซเคิลขยะ วิเคราะห์ภาพนี้และให้ข้อมูลดังนี้:
      1. ประเภทของขยะ (ระบุเฉพาะประเภท เช่น พลาสติก, กระดาษ, แก้ว, โลหะ, อินทรีย์ โดยสามารถมีหลายประเภทได้)
      2. ปริมาณหรือจำนวนโดยประมาณ format คือ (ตัวเลข + " " + กก.) เท่านั้น ห้ามใส่ข้อความอื่นๆ หรือข้อความที่ไม่เกี่ยวข้อง
      3. ระดับความมั่นใจในการประเมินครั้งนี้ (แสดงเป็นเปอร์เซ็นต์)

      ตอบกลับในรูปแบบ JSON เช่นนี้:
      {
        "trashType": "ประเภทของขยะ",
        "quantity": "ปริมาณโดยประมาณพร้อมหน่วย format คือ (ตัวเลข + " " + กก.) เท่านั้น ห้ามใส่ข้อความอื่นๆ หรือข้อความที่ไม่เกี่ยวข้อง",
        "confidence": ระดับความมั่นใจในรูปแบบตัวเลขระหว่าง 0 ถึง 1,
        "suggest": "ข้อเสนอแนะเพิ่มเติม (ถ้ามี)"
      }
      ตัวอย่าง:
      {
        "trashType": "พลาสติก, กระดาษ",
        "quantity": "1 กก.",
        "confidence": 0.95
      }
      `;

      const result = await model.generateContent([{ inlineData: { data: base64Data.split(',')[1], mimeType: file.type } }, prompt]);
      const response = await result.response;
      const text = await response.text();
      try {
        const parsedText = convertToJSONFormat(text);
        const parsedResult = JSON.parse(parsedText);

        if (parsedResult.trashType && parsedResult.quantity && parsedResult.confidence) {
          setVerificationResult(parsedResult);
          setVerificationStatus('success');
          setNewReport({
            ...newReport,
            type: parsedResult.trashType,
            amount: parsedResult.quantity,
          });
          console.log('Verification result:', parsedResult);
        } else {
          throw new Error('Missing fields in response');
        }
      } catch (error) {
        console.error('Failed to parse JSON response:', text, error);
        setVerificationStatus('failure');
      }

    } catch (error) {
      console.error('Error verifying trash:', error);
      setVerificationStatus('failure');
      toast.error('Failed to verify the trash. Please try again.');
    }
  };

  // Handle form submission for creating a new trash report
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || verificationStatus !== 'success') {
      toast.error('Please verify the trash or log in before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const report = await createReport(user.id, newReport.location, newReport.type, newReport.amount, preview || undefined);
      if (report) {
        setReports([{
          id: report.id,
          location: report.location,
          trashType: report.trashType,
          amount: report.amount,
          createdAt: report.createdAt.toISOString(),
        }, ...reports]);
      }
      toast.success('Report submitted successfully!');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch user data and recent reports when the component mounts
  useEffect(() => {
    (async () => {
      const email = localStorage.getItem('userEmail');
      if (email) {
        const user = await getUserByEmail(email) || await createUser(email, 'default-avatar.jpg', 'Anonymous');
        setUser(user);

        const recentReports = (await getRecentReports()).map(report => ({
          ...report,
          createdAt: report.createdAt.toISOString(),
        }));
        setReports(recentReports);
      } else {
        router.push('/');
      }
    })();
  }, [router]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-semibold mb-6 text-gray-800">รายงานขยะ</h1>

      {/* Form for trash report submission */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl mb-12">
        {/* File upload section */}
        <div className="mb-8">
          <label htmlFor="trash-image" className="block text-lg font-medium text-gray-700 mb-2">
            อัปโหลดรูปภาพขยะ
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed hover:border-green-500 transition-colors duration-300">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="trash-image"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
                >
                  <span>คลิกเพื่ออัปโหลดรูปขยะ</span>
                  <input id="trash-image" name="trash-image" type="file" className="sr-only" onChange={handleFileChange} accept="image/*" />
                </label>
                <p className="pl-1">หรือลากวางรูปจากโฟลเดอร์</p>
              </div>
              <p className="text-xs text-gray-500">
                รองรับไฟล์ประเภท PNG, JPG, GIF ขนาดไม่เกิน 10MB
              </p>
            </div>
          </div>
        </div>

        {preview && (
          <Image src={preview} alt="Trash preview" className="max-w-full h-auto shadow-md mb-4" width={5000} height={500} />
        )}

        {/* Trash verification and form submission */}
        <Button
          type="button"
          onClick={handleVerify}
          className="w-full mb-8  text-white py-3 text-lg transition-colors duration-300"
          disabled={!file || verificationStatus === 'verifying'}
        >
          {verificationStatus === 'verifying' ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              กำลังตรวจสอบ...
            </>
          ) : 'ตรวจสอบขยะ'}
        </Button>

        {verificationStatus === 'success' && verificationResult && (
          <div className="bg-green-50  p-4 mb-8 rounded-r-xl">
            <div className="flex items-center">
              <div>
                <h3 className="text-lg font-medium text-green-800">
                  ตรวจสอบสำเร็จ
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>ประเภทขยะ: {verificationResult.trashType}</p>
                  <p>ปริมาณขยะ: {verificationResult.quantity}</p>
                  <p>ความแม่นยำ: {(verificationResult.confidence * 100).toFixed(2)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div className=' col-span-2'>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">สถานที่</label>
            {isLoaded ? (
              <StandaloneSearchBox
                onLoad={onLoad}
                onPlacesChanged={onPlacesChanged}
              >
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={newReport.location}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                  placeholder="กรอกสถานที่ของขยะ"
                />
              </StandaloneSearchBox>
            ) : (
              <input
                type="text"
                id="location"
                name="location"
                value={newReport.location}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
                placeholder="กรอกสถานที่ของขยะ"
              />
            )}
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">ประเภทขยะ</label>
            <input
              type="text"
              id="type"
              name="type"
              value={newReport.type}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder=""
              readOnly
            />
          </div>
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">ปริมาณขยะ</label>
            <input
              type="text"
              id="amount"
              name="amount"
              value={newReport.amount}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
              placeholder=""
              readOnly
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full  text-white py-3 text-lg transition-colors duration-300 flex items-center justify-center"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              รายงานขยะ...
            </>
          ) : 'รายงานขยะ'}
        </Button>
      </form>

      <h2 className="text-3xl font-semibold mb-6 text-gray-800">รายงานขยะล่าสุด</h2>
      <div className="bg-white overflow-hidden">
        <div className="max-h-96 overflow-y-auto">
          <table className="w-full">
            <thead className=" sticky top-0 border border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">สถานที่</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภทขยะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ปริมาณขยะ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่รายงาน</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reports.map((report) => (
                <tr key={report.id} className="hover:bg-gray-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <MapPin className="inline-block w-4 h-4 mr-2 text-green-500" />
                    {report.location}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.trashType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.amount}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{report.createdAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}