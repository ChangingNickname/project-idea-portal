'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserAvatar } from '@/components/user/UserAvatar';
import { User } from '@/types/user';

export default function UserProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch(`/api/user/${params.id}`, {
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found');
            return;
          }
          throw new Error('Failed to fetch user profile');
        }

        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-default-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            <div className="h-4 bg-default-200 rounded w-3/4"></div>
            <div className="h-4 bg-default-200 rounded w-1/2"></div>
            <div className="h-4 bg-default-200 rounded w-2/3"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-danger-50 text-danger p-4 rounded-lg">
          {error}
        </div>
        <button
          onClick={() => router.back()}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
        >
          Go Back
        </button>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-content1 rounded-lg shadow-lg p-6">
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-center gap-4">
            <UserAvatar
              user={{
                photoURL: profile.photoURL,
                displayName: profile.displayName,
                email: profile.email,
                isAnonymous: profile.isAnonymous
              }}
              size="lg"
            />
            <div>
              <h1 className="text-2xl font-bold">
                {profile.displayName || (profile.isAnonymous ? 'Anonymous User' : 'User Profile')}
              </h1>
              <p className="text-default-500">User information</p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Basic Information</h2>
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-default-500">User ID (UUID)</p>
                <p className="text-lg font-mono">{profile.uid}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">Account Type</p>
                <p className="text-lg">{profile.isAnonymous ? 'Anonymous' : 'Registered'}</p>
              </div>
              {profile.email && (
                <div>
                  <p className="text-sm font-medium text-default-500">Email</p>
                  <p className="text-lg flex items-center gap-2">
                    {profile.email}
                    {profile.emailVerified && (
                      <span className="text-success text-sm">✓ Verified</span>
                    )}
                  </p>
                </div>
              )}
              {profile.phoneNumber && (
                <div>
                  <p className="text-sm font-medium text-default-500">Phone Number</p>
                  <p className="text-lg">{profile.phoneNumber}</p>
                </div>
              )}
              {profile.displayName && (
                <div>
                  <p className="text-sm font-medium text-default-500">Display Name</p>
                  <p className="text-lg">{profile.displayName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Authentication Providers */}
          {profile.providerData.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Authentication Methods</h2>
              <div className="grid gap-4">
                {profile.providerData.map((provider) => (
                  <div key={provider.uid} className="bg-content2 p-4 rounded-lg">
                    <p className="font-medium capitalize">{provider.providerId}</p>
                    {provider.displayName && (
                      <p className="text-sm text-default-500">{provider.displayName}</p>
                    )}
                    {provider.email && (
                      <p className="text-sm text-default-500">{provider.email}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multi-Factor Authentication */}
          {profile.multiFactor?.enrolledFactors && profile.multiFactor.enrolledFactors.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Multi-Factor Authentication</h2>
              <div className="grid gap-4">
                {profile.multiFactor.enrolledFactors.map((factor) => (
                  <div key={factor.uid} className="bg-content2 p-4 rounded-lg">
                    <p className="font-medium capitalize">{factor.factorId}</p>
                    {factor.displayName && (
                      <p className="text-sm text-default-500">{factor.displayName}</p>
                    )}
                    <p className="text-sm text-default-500">
                      Enrolled: {new Date(factor.enrollmentTime ?? '').toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Account Metadata */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Account Details</h2>
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-default-500">Account Created</p>
                <p className="text-lg">
                  {new Date(profile.metadata.creationTime ?? '').toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">Last Sign In</p>
                <p className="text-lg">
                  {new Date(profile.metadata.lastSignInTime ?? '').toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-default-500">Last Refresh</p>
                <p className="text-lg">
                  {new Date(profile.metadata.lastRefreshTime ?? '').toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Account Status</h2>
            <div className="grid gap-4">
              <div>
                <p className="text-sm font-medium text-default-500">Status</p>
                <p className="text-lg">
                  {profile.disabled ? (
                    <span className="text-danger">Disabled</span>
                  ) : (
                    <span className="text-success">Active</span>
                  )}
                </p>
              </div>
              {profile.tenantId && (
                <div>
                  <p className="text-sm font-medium text-default-500">Tenant ID</p>
                  <p className="text-lg font-mono">{profile.tenantId}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 