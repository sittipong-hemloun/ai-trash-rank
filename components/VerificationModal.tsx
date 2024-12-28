import { useEffect } from "react"
import CollectionTask from "@/app/types/collectionTask"
import VerificationCollectResultDisplay from "./VerificationCollectResultDisplay"
import { Button } from "./ui/button"
import { Loader, Upload, Camera } from "lucide-react"
import { CollectVerificationResult } from "@/app/collect/page"

interface VerificationModalProps {
  task: CollectionTask
  user: {
    id: number
    email: string
    name: string
    point: number
    score: number
  }
  verificationImage: string | null
  setVerificationImage: (image: string | null) => void
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleVerify: () => void
  verificationStatus: 'idle' | 'verifying' | 'success' | 'failure'
  verificationResult: CollectVerificationResult | null
  onClose: () => void
}

/**
 * Modal for verifying collected trash.
 */
const VerificationModal: React.FC<VerificationModalProps> = ({
  verificationImage,
  handleImageUpload,
  handleVerify,
  verificationStatus,
  verificationResult,
  onClose,
}) => {
  // Automatically close modal if verification succeeded AND trash is collected
  useEffect(() => {
    if (
      verificationStatus === 'success' &&
      verificationResult?.trashIsCollected
    ) {
      onClose()
    }
  }, [verificationStatus, verificationResult, onClose])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold mb-4">ตรวจสอบการเก็บขยะ</h3>
        <p className="mb-4 text-sm text-gray-600">
          อัปโหลดรูปขยะที่เก็บเพื่อให้เราตรวจสอบและรอรับ point และ score ของคุณ
        </p>
        <div className="mb-4">
          <label
            htmlFor="verification-image"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            อัปโหลดรูปขยะที่เก็บ
          </label>
          {/* Desktop Upload */}
          <div className="hidden md:flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="verification-image"
                  className="relative cursor-pointer bg-white rounded-md text-center w-full font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                >
                  <span>อัปโหลดรูป</span>
                  <input
                    id="verification-image"
                    name="verification-image"
                    type="file"
                    className="sr-only"
                    onChange={handleImageUpload}
                    accept="image/*"
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF ไปจนถึง 10MB
              </p>
            </div>
          </div>

          {/* Mobile Upload */}
          <div className="mt-2 flex items-center justify-center md:hidden w-full">
            <label
              htmlFor="verification-image-mobile"
              className="flex flex-col items-center cursor-pointer bg-green-500 text-white px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full"
            >
              <Camera className="h-6 w-6 mb-1" />
              <span className="text-sm">ถ่ายรูปจากกล้อง</span>
              <input
                id="verification-image-mobile"
                name="verification-image-mobile"
                type="file"
                capture="environment"
                className="sr-only"
                onChange={handleImageUpload}
                accept="image/*"
              />
            </label>
          </div>
        </div>

        {/* Image Preview */}
        {verificationImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={verificationImage}
            alt="Verification"
            className="mb-4 rounded-md w-full"
          />
        )}

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          className="w-full"
          disabled={!verificationImage || verificationStatus === 'verifying'}
        >
          {verificationStatus === 'verifying' ? (
            <>
              <Loader className="animate-spin -ml-1 mr-3 h-5 w-5" />
              กำลังตรวจสอบ...
            </>
          ) : (
            'Verify Collection'
          )}
        </Button>

        {/* Verification Results */}
        {verificationStatus === 'success' && verificationResult && (
          <VerificationCollectResultDisplay result={verificationResult} />
        )}

        {/* Verification Failure Message */}
        {verificationStatus === 'failure' && (
          <p className="mt-2 text-red-600 text-center text-sm">
            การตรวจสอบล้มเหลว ลองอีกครั้ง
          </p>
        )}

        {/* Close Button */}
        <Button onClick={onClose} variant="outline" className="w-full mt-2">
          ปิด
        </Button>
      </div>
    </div>
  )
}

export default VerificationModal