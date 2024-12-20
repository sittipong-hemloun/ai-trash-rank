/**
 * Represents the result of a trash verification process.
 */
interface VerificationResult {
  trashType?: string;
  quantity?: string;
  trashTypeMatch?: boolean;
  quantityMatch?: boolean;
  confidence: number;
}


export default VerificationResult