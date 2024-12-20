import VerificationResult from "@/app/types/verificationResult"

interface VerificationCollectResultDisplayProps {
  result: VerificationResult
}

/**
 * Displays the results of trash verification.
 */
const VerificationCollectResultDisplay: React.FC<VerificationCollectResultDisplayProps> = ({ result }) => (
  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
    <p>
      Trash Type Match: {result.trashTypeMatch ? 'ตรงกัน' : 'ไม่ตรงกัน'}
    </p>
    <p>
      Quantity Match: {result.quantityMatch ? 'ตรงกัน' : 'ไม่ตรงกัน'}
    </p>
    <p>Confidence: {(result.confidence * 100).toFixed(2)}%</p>
  </div>
)

export default VerificationCollectResultDisplay