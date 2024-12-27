// File: /Users/sittiponghemloun/Developer/my_project/ai-trash-rank-copy/components/FileUpload.tsx

import { Upload, Camera } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  setFile: (file: File) => void;
  preview: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ setFile, preview }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <div className="mb-8">
      <label htmlFor="trash-image" className="block text-lg font-medium text-gray-700 mb-2">
        อัปโหลดรูปภาพขยะ
      </label>
      {/* Desktop */}
      <div className="hidden mt-1 md:flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed hover:border-green-500 transition-colors duration-300">
        <div className="space-y-1 text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <div className="flex text-sm text-gray-600">
            <label
              htmlFor="trash-image"
              className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-green-500"
            >
              <span>คลิกเพื่ออัปโหลดรูปขยะ</span>
              <input
                id="trash-image"
                name="trash-image"
                type="file"
                capture="environment"
                className="sr-only"
                onChange={handleFileChange}
                accept="image/*"
              />
            </label>
            <p className="pl-1">หรือลากวางรูปจากโฟลเดอร์</p>
          </div>
          <p className="text-xs text-gray-500">
            รองรับไฟล์ประเภท PNG, JPG, GIF ขนาดไม่เกิน 10MB
          </p>
        </div>
      </div>
      {/* Mobile */}
      <div className="mt-2 flex items-center justify-center md:hidden w-full">
        <label
          htmlFor="trash-image-mobile"
          className="flex flex-col items-center cursor-pointer bg-green-500 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full"
        >
          <Camera className="h-6 w-6 mb-1" />
          <span className="text-sm">ถ่ายรูปจากกล้อง</span>
          <input
            id="trash-image-mobile"
            name="trash-image-mobile"
            type="file"
            capture="environment"
            className="sr-only"
            onChange={handleFileChange}
            accept="image/*"
          />
        </label>
      </div>

      {/* Image Preview */}
      {preview && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="Trash preview"
          className="max-w-full h-auto shadow-md mb-4"
        />
      )}
    </div>
  );
};

export default FileUpload;