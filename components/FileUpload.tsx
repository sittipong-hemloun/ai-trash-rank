// File: /Users/sittiponghemloun/Developer/my_project/ai-trash-rank-copy/components/FileUpload.tsx

import { Upload } from 'lucide-react';

interface FileUploadProps {
  file: File | null;
  setFile: (file: File) => void;
  preview: string | null;
}

const FileUpload: React.FC<FileUploadProps> = ({ file, setFile, preview }) => {
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
      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed hover:border-green-500 transition-colors duration-300">
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

      {/* Image Preview */}
      {preview && (
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