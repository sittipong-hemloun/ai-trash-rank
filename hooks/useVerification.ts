// File: /Users/sittiponghemloun/Developer/my_project/ai-trash-rank-copy/hooks/useVerification.ts

import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface VerificationResult {
  trashType: string;
  quantity: string;
  confidence: number;
  suggest?: string;
}

type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failure';

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

const useVerification = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  /**
   * Handles file selection and sets a preview image.
   * @param selectedFile - The selected file.
   */
  const handleFileSelection = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  /**
   * Converts a file to a Base64 string.
   * @param file - The file to convert.
   * @returns A promise that resolves to the Base64 string.
   */
  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Extracts JSON data from a response string.
   * @param text - The response text containing JSON.
   * @returns The extracted JSON string.
   * @throws Will throw an error if JSON format is invalid.
   */
  const convertToJSONFormat = (text: string): string => {
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1) {
      return text.slice(jsonStart, jsonEnd + 1);
    }
    throw new Error('Invalid JSON format');
  };

  /**
   * Handles the trash verification process using Generative AI.
   */
  const handleVerify = async () => {
    if (!file) {
      toast.error('Please select a file to verify.');
      return;
    }

    setVerificationStatus('verifying');
    setIsVerifying(true);

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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
}
ตัวอย่าง:
{
  "trashType": "พลาสติก, กระดาษ",
  "quantity": "1 กก.",
  "confidence": 0.95
}`;

      const result = await model.generateContent([
        { inlineData: { data: base64Data.split(',')[1], mimeType: file.type } },
        prompt,
      ]);
      const response = await result.response;
      const text = await response.text();

      try {
        const parsedText = convertToJSONFormat(text);
        const parsedResult: VerificationResult = JSON.parse(parsedText);

        if (
          parsedResult.trashType &&
          parsedResult.quantity &&
          parsedResult.confidence !== undefined
        ) {
          setVerificationResult(parsedResult);
          setVerificationStatus('success');
          toast.success('Trash verification successful!');
        } else {
          throw new Error('Missing fields in response');
        }
      } catch (error) {
        console.error('Failed to parse JSON response:', text, error);
        setVerificationStatus('failure');
        toast.error('Failed to parse verification results.');
      }
    } catch (error) {
      console.error('Error verifying trash:', error);
      setVerificationStatus('failure');
      toast.error('Failed to verify the trash. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    file,
    preview,
    setFile: handleFileSelection,
    previewImage: preview,
    verificationStatus,
    verificationResult,
    handleVerify,
    isVerifying,
  };
};

export default useVerification;