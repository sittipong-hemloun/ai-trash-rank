import { CollectVerificationResult } from "@/app/(main)/collect/page"

interface VerificationCollectResultDisplayProps {
  result: CollectVerificationResult
}

/**
 * Displays the results of trash verification.
 */
const VerificationCollectResultDisplay: React.FC<VerificationCollectResultDisplayProps> = ({ result }) => (
  // <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
  <div className={`mt-4 p-4 ${result.trashIsCollected ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'} rounded-md`}>
    <p>
      ขยะถูกเก็บอย่างถูกต้อง: {result.trashIsCollected ? 'ใช่' : 'ไม่ใช่'}
    </p>
    <p>
      ความแม่นยำ: {(result.confidence * 100).toFixed(2)}%
    </p>
  </div>
)

export default VerificationCollectResultDisplay