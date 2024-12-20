import { Button } from '@/components/ui/button';
import { StandaloneSearchBox } from '@react-google-maps/api';
import FileUpload from '@/components/FileUpload';
import VerificationReportResultDisplay from '@/components/VerificationReportResultDisplay';
import { Loader } from 'lucide-react';

interface VerificationResult {
  trashType?: string;
  quantity?: string;
  trashTypeMatch?: boolean;
  quantityMatch?: boolean;
  confidence: number;
}

interface ReportFormProps {
  file: File | null;
  setFile: (file: File) => void;
  preview: string | null;
  verificationStatus: 'idle' | 'verifying' | 'success' | 'failure';
  verificationResult: VerificationResult | null;
  handleVerify: () => void;
  isVerifying: boolean;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  isLoaded: boolean;
  onLoad: (ref: google.maps.places.SearchBox) => void;
  onPlacesChanged: () => void;
  location: string;
}

const ReportForm: React.FC<ReportFormProps> = ({
  file,
  setFile,
  preview,
  verificationStatus,
  verificationResult,
  handleVerify,
  isVerifying,
  handleInputChange,
  handleSubmit,
  isSubmitting,
  isLoaded,
  onLoad,
  onPlacesChanged,
  location,
}) => {
  return (
    <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl mb-12">
      {/* File Upload Section */}
      <FileUpload file={file} setFile={setFile} preview={preview} />

      {/* Verification Button */}
      <Button
        type="button"
        onClick={handleVerify}
        className="w-full mb-8 text-white py-3 text-lg transition-colors duration-300"
        disabled={!file || isVerifying}
      >
        {isVerifying ? (
          <>
            <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            กำลังตรวจสอบ...
          </>
        ) : (
          'ตรวจสอบขยะ'
        )}
      </Button>

      {/* Verification Result Display */}
      <VerificationReportResultDisplay
        verificationStatus={verificationStatus}
        verificationResult={verificationResult}
      />

      {/* Report Form Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Location Field with Google Places SearchBox */}
        <div className="col-span-2">
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            สถานที่
          </label>
          {isLoaded ? (
            <StandaloneSearchBox onLoad={onLoad} onPlacesChanged={onPlacesChanged}>
              <input
                type="text"
                id="location"
                name="location"
                value={location}
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
              value={location}
              onChange={handleInputChange}
              required
              className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300"
              placeholder="กรอกสถานที่ของขยะ"
            />
          )}
        </div>

        {/* Trash Type Field */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            ประเภทขยะ
          </label>
          <input
            type="text"
            id="type"
            name="type"
            value={verificationResult?.trashType}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
            readOnly
          />
        </div>

        {/* Trash Amount Field */}
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            ปริมาณขยะ
          </label>
          <input
            type="text"
            id="quantity"
            name="quantity"
            value={verificationResult?.quantity}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
            readOnly
          />
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        className="w-full text-white py-3 text-lg transition-colors duration-300 flex items-center justify-center"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
            รายงานขยะ...
          </>
        ) : (
          'รายงานขยะ'
        )}
      </Button>
    </form>
  );
};

export default ReportForm;