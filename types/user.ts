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

export type User = {
  uid: string;
  email: string | null;
  emailVerified: boolean;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  disabled: boolean;
  isAnonymous: boolean;
  providerData: {
    providerId: string;
    uid: string;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    photoURL: string | null;
  }[];
  customClaims: Record<string, any> | null;
  metadata: {
    creationTime: string | null;
    lastSignInTime: string | null;
    lastRefreshTime: string | null;
  };
  tenantId: string | null;
  multiFactor: {
    uid: string;
    factorId: string;
    displayName: string | null;
    enrollmentTime: string;
  }[];
}; 