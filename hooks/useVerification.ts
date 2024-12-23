import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Verification modes
export type VerificationMode = 'collect' | 'report';

// Common verification status
export type VerificationStatus = 'idle' | 'verifying' | 'success' | 'failure';

interface VerificationResult {
  trashType?: string;
  quantity?: string;
  trashTypeMatch?: boolean;
  quantityMatch?: boolean;
  confidence: number;
}

// Configuration for verification
interface VerificationConfig {
  mode: VerificationMode;
  expectedTrashType?: string;
  expectedQuantity?: string;
}

const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

/**
 * Custom hook for handling trash verification
 * @param config - Configuration object for the verification process
 */
const useVerification = (config: VerificationConfig) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>({
    confidence: 0,
    trashTypeMatch: false,
    quantityMatch: false,
    trashType: '',
    quantity: '',
  });
  const [isVerifying, setIsVerifying] = useState(false);

  /**
   * Handles file selection and sets a preview image
   * @param selectedFile - The selected file to process
   */
  const handleFileSelection = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(selectedFile);
  };

  /**
   * Converts a file to Base64 string
   * @param file - The file to convert
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
   * Extracts JSON from response text
   * @param text - The text containing JSON
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
   * Generates the appropriate prompt based on verification mode
   */
  const generatePrompt = (mode: VerificationMode): string => {
    const basePrompt = 'คุณเป็นผู้เชี่ยวชาญด้านการจัดการและการรีไซเคิลขยะ วิเคราะห์ภาพนี้และให้ข้อมูลดังนี้:';

    if (mode === 'collect') {
      return `${basePrompt}
1. ยืนยันว่าประเภทของขยะ (ระบุเฉพาะประเภท เช่น พลาสติก, กระดาษ, แก้ว, โลหะ, อินทรีย์ โดยสามารถมีหลายประเภทได้) ตรงกับ: ${config.expectedTrashType}
2. ปริมาณหรือจำนวนโดยประมาณ format คือ (ตัวเลข + " " + กก.) เท่านั้น ห้ามใส่ข้อความอื่นๆ หรือข้อความที่ไม่เกี่ยวข้อง ใกล้เคียงกับ: ${config.expectedQuantity}
3. ระดับความมั่นใจในการประเมินครั้งนี้ (แสดงเป็นเปอร์เซ็นต์)
ตอบกลับในรูปแบบ JSON เช่นนี้:
{
  "trashTypeMatch": true/false,
  "quantityMatch": true/false,
  "confidence": confidence level as a number between 0 and 1
}`;
    }

    return `${basePrompt}
1. ประเภทของขยะ (ระบุเฉพาะประเภท เช่น พลาสติก, กระดาษ, แก้ว, โลหะ, อินทรีย์ โดยสามารถมีหลายประเภทได้)
2. ปริมาณหรือจำนวนโดยประมาณ format คือ (ตัวเลข + " " + กก.) เท่านั้น ห้ามใส่ข้อความอื่นๆ หรือข้อความที่ไม่เกี่ยวข้อง
3. ระดับความมั่นใจในการประเมินครั้งนี้ (แสดงเป็นเปอร์เซ็นต์)

ตอบกลับในรูปแบบ JSON เช่นนี้:
{
  "trashType": "ประเภทของขยะ",
  "quantity": "ปริมาณโดยประมาณพร้อมหน่วย",
  "confidence": ระดับความมั่นใจในรูปแบบตัวเลขระหว่าง 0 ถึง 1
}`;
  };

  /**
   * Validates the verification result based on mode
   * @param result - The result to validate
   */
  const validateVerificationResult = (
    result: VerificationResult) => {
    if (config.mode === 'collect') {
      return (
        typeof result.trashTypeMatch === 'boolean' &&
        typeof result.quantityMatch === 'boolean' &&
        typeof result.confidence === 'number'
      );
    } else {
      return (
        typeof result.trashType === 'string' &&
        typeof result.quantity === 'string' &&
        typeof result.confidence === 'number'
      );
    }
  };

  /**
   * Handles the verification process
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
      const prompt = generatePrompt(config.mode);

      const result = await model.generateContent([
        { inlineData: { data: base64Data.split(',')[1], mimeType: file.type } },
        prompt,
      ]);

      const response = await result.response;
      const text = await response.text();

      try {
        const parsedText = convertToJSONFormat(text);
        const parsedResult = JSON.parse(parsedText);

        if (validateVerificationResult(parsedResult)) {
          setVerificationResult(parsedResult);
          setVerificationStatus('success');
          toast.success('Trash verification successful!');
        } else {
          throw new Error('Invalid verification result format');
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

  /**
   * Resets the verification state
   */
  const resetVerification = () => {
    setFile(null);
    setPreview(null);
    setVerificationStatus('idle');
    setVerificationResult(null);
    setIsVerifying(false);
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
    resetVerification,
  };
};

export default useVerification;