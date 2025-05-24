import { Common } from './common';

export type ProviderData = {
  providerId: string;
  uid: string;
  displayName: string | null | undefined;
  email: string | null | undefined;
  phoneNumber: string | null | undefined;
  photoURL: string | null | undefined;
};

export type MultiFactorData = {
  uid: string;
  factorId: string;
  displayName: string | null | undefined;
  enrollmentTime: string | undefined;
};

export type UserMetadata = {
  creationTime: string | null | undefined;
  lastSignInTime: string | null | undefined;
  lastRefreshTime: string | null | undefined;
};

export type User = Common & {
  email: string | null | undefined;
  emailVerified: boolean;
  displayName: string | null | undefined;
  photoURL: string | null | undefined;
  phoneNumber: string | null | undefined;
  disabled: boolean;
  isAnonymous: boolean;
  providerData: ProviderData[];
  customClaims: Record<string, any> | null | undefined;
  metadata: UserMetadata;
  tenantId: string | null | undefined;
  multiFactor?: MultiFactorData[];
}; 