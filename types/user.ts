interface UserProviderData {
  providerId: string;
  uid: string;
  displayName: string | null;
  email: string | null;
  phoneNumber: string | null;
  photoURL: string | null;
}

interface UserMetadata {
  creationTime: string | null;
  lastSignInTime: string | null;
  lastRefreshTime: string | null;
}

interface MultiFactorInfo {
  uid: string;
  factorId: string;
  displayName: string | null;
  enrollmentTime: string | null;
}

export interface User {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  disabled: boolean;
  isAnonymous: boolean;
  providerData: UserProviderData[];
  customClaims: Record<string, any> | null;
  metadata: UserMetadata;
  tenantId: string | null;
  multiFactor?: {
    enrolledFactors: MultiFactorInfo[];
  } | null;
}
