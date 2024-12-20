// File: /Users/sittiponghemloun/Developer/my_project/ai-trash-rank-copy/components/VerificationReportResultDisplay.tsx

interface VerificationResult {
  trashType?: string;
  quantity?: string;
  trashTypeMatch?: boolean;
  quantityMatch?: boolean;
  confidence: number;
}

interface VerificationReportResultDisplayProps {
  verificationStatus: 'idle' | 'verifying' | 'success' | 'failure';
  verificationResult: VerificationResult | null;
}

const VerificationReportResultDisplay: React.FC<VerificationReportResultDisplayProps> = ({
  verificationStatus,
  verificationResult,
}) => {
  if (verificationStatus !== 'success' || !verificationResult) {
    return null;
  }

  return (
    <div className="bg-green-50 p-4 mb-8 rounded-r-xl">
      <div className="flex items-center">
        <div>
          <h3 className="text-lg font-medium text-green-800">ตรวจสอบสำเร็จ</h3>
          <div className="mt-2 text-sm text-green-700">
            <p>ประเภทขยะ: {verificationResult.trashType}</p>
            <p>ปริมาณขยะ: {verificationResult.quantity}</p>
            <p>ความแม่นยำ: {(verificationResult.confidence * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationReportResultDisplay;