/**
 * Represents authenticated user information.
 */
declare type AuthUserInfo = {
  email?: string
  name?: string
  profileImage?: string
  aggregateVerifier?: string
  verifier: string
  verifierId: string
  typeOfLogin: unknown
  dappShare?: string
  /**
   * Token issued by Web3Auth.
   */
  idToken?: string
  /**
   * Token issued by OAuth provider. Will be available only if you are using
   * custom verifiers.
   */
  oAuthIdToken?: string
  /**
   * Access Token issued by OAuth provider. Will be available only if you are using
   * custom verifiers.
   */
  oAuthAccessToken?: string
  appState?: string
  touchIDPreference?: string
  isMfaEnabled?: boolean
}

export interface User {
  id: number
  email: string
  name: string
  point: number
  score: number
}

export default AuthUserInfo