'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { StandaloneSearchBox } from '@react-google-maps/api';
import FileUpload from '@/components/FileUpload';
import VerificationReportResultDisplay from '@/components/VerificationReportResultDisplay';
import { Loader, RefreshCw } from 'lucide-react';

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
  /**
   * A helper function to detect if the user is on a mobile device.
   * You can refine this check as needed.
   */
  function isMobileDevice() {
    if (typeof window === 'undefined') return false;
    return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
  }

  /**
   * Function to fetch and set the current location using Geolocation API
   */
  const fetchCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Call Google Geocoding API to get human-readable address
            const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
            const response = await fetch(geocodingUrl);
            const data = await response.json();

            if (data.results && data.results.length > 0) {
              const address = data.results[0].formatted_address;

              // Fire handleInputChange event for "location" input
              const syntheticEvent = {
                target: {
                  name: 'location',
                  value: address,
                },
              } as unknown as React.ChangeEvent<HTMLInputElement>;

              handleInputChange(syntheticEvent);
            }
          } catch (error) {
            console.error('Error while reverse geocoding:', error);
            // Optionally, you can show a toast notification here
          }
        },
        (error) => {
          console.error('Failed to retrieve geolocation:', error);
          // Optionally, you can show a toast notification here
        },
        { enableHighAccuracy: true }
      );
    }
  };

  /**
   * useEffect to auto-fill location on mobile devices when the component mounts
   */
  useEffect(() => {
    // Only attempt to get geolocation on mobile devices
    if (isMobileDevice() && 'geolocation' in navigator) {
      fetchCurrentLocation();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array ensures this runs once on mount

  return (
    <form onSubmit={handleSubmit} className="bg-gray-200 p-8 rounded-2xl mb-12">
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
          <div className="relative">
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
            {/* Refresh Location Button */}
            {isMobileDevice() && (
              <button
                type="button"
                onClick={fetchCurrentLocation}
                className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
                title="รีเฟรชตำแหน่งปัจจุบัน"
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* Trash Type Field */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
            ประเภทขยะ
          </label>
          <input
            type="text"
            id="type"
            name="type"
            value={verificationResult?.trashType || ''}
            onChange={handleInputChange}
            required
            className="w-full px-4 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-300 bg-gray-100"
            readOnly
          />
        </div>

        {/* Trash Amount Field */}
        <div className="col-span-2 md:col-span-1">
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
            ปริมาณขยะ
          </label>
          <input
            type="text"
            id="quantity"
            name="quantity"
            value={verificationResult?.quantity || ''}
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