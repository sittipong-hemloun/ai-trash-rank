import { useState } from 'react';
import { toast } from 'react-hot-toast';
// Import OpenAI client libraries instead of Google’s Gemini API.
import { OpenAI } from 'openai';

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

const openaiApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY!;

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
1. พบขยะหรือไม่ ถ้าพบให้ระบุเป็น true ถ้าไม่พบให้ระบุเป็น false
2. ประเภทของขยะ (ระบุเฉพาะประเภท เช่น พลาสติก, กระดาษ, แก้ว, โลหะ, อินทรีย์ โดยสามารถมีหลายประเภทได้)
3. ปริมาณหรือจำนวนโดยประมาณ format คือ (ตัวเลข + " " + กก.) เท่านั้น ห้ามใส่ข้อความอื่นๆ หรือข้อความที่ไม่เกี่ยวข้อง
4. ระดับความมั่นใจในการประเมินครั้งนี้ (แสดงเป็นเปอร์เซ็นต์)
5. array ของ object วัสดุทั้งหมดที่พบในรูปภาพไม่ว่าจะเป็นองค์ประกอบย่อยแค่ไหนก็ตาม พร้อมบอกประเภทถังขยะที่เหมาะสม (yellow, green, blue, red) เช่น:
[
  {
    "material": "หลอด",
    "binType": "yellow"
  },
  {
    "material": "แก้วน้ำ",
    "binType": "yellow"
  }
]

ตอบกลับในรูปแบบ JSON เช่นนี้:
{
  "isThereTrash": true/false,
  "trashType": "ประเภทของขยะ",
  "quantity": "ปริมาณโดยประมาณพร้อมหน่วย",
  "confidence": ระดับความมั่นใจในรูปแบบตัวเลขระหว่าง 0 ถึง 1,
  "materials": [
    {
      "material": "วัสดุที่พบ",
      "binType": "ประเภทถังขยะที่เหมาะสม"
    }
  ]
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
      toast.error('กรุณาเลือกไฟล์เพื่อยืนยัน');
      return;
    }

    setVerificationStatus('verifying');
    setIsVerifying(true);

    try {
      const openai = new OpenAI({
        apiKey: openaiApiKey,
        dangerouslyAllowBrowser: true
      });

      const base64Data = await readFileAsBase64(file);

      const prompt = generatePrompt(config.mode);
      const imageData = base64Data.split(',')[1];

      const messages = [{
        role: "user" as const,
        content: [
          {
            type: "text" as const,
            text: prompt,
          },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:image/jpeg;base64,${imageData}`,
            },
          },
        ],
      }];

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: messages,
        response_format: { type: "json_object" },
      });

      const text = completion.choices[0].message?.content || '';

      try {
        const parsedText = convertToJSONFormat(text);
        const parsedResult = JSON.parse(parsedText);

        if (validateVerificationResult(parsedResult)) {
          setVerificationResult(parsedResult);
          setVerificationStatus('success');
          toast.success('การตรวจสอบถังขยะสำเร็จแล้ว!');
        } else {
          throw new Error('Invalid verification result format');
        }
      } catch (error) {
        console.error('Failed to parse JSON response:', text, error);
        setVerificationStatus('failure');
        toast.error('ไม่สามารถแยกวิเคราะห์ผลลัพธ์การตรวจสอบได้');
      }
    } catch (error) {
      console.error('Error verifying trash:', error);
      setVerificationStatus('failure');
      toast.error('ไม่สามารถตรวจสอบถังขยะได้ กรุณาลองใหม่อีกครั้ง');
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