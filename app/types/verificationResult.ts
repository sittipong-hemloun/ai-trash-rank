/**
 * Represents the result of a trash verification process.
 */
interface VerificationResult {
  trashTypeMatch: boolean
  quantityMatch: boolean
  confidence: number
}

export default VerificationResult