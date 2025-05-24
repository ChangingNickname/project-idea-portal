'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types/user';
import { UserFullProfile } from '@/components/user/UserFullProfile';
import { Card, CardHeader, CardBody } from "@heroui/card";

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

export default function UserProfilePage({ params }: ProfilePageProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchUserData() {
      try {
        const { id } = await params;
        const response = await fetch(`/api/user/${id}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('User not found');
          }
          throw new Error('Failed to load user data');
        }
        const data = await response.json();
        if (isMounted) {
          setUser(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'An error occurred');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [params]);

  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardBody className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold text-red-600">Error</h1>
          </CardHeader>
          <CardBody>
            <p>{error}</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <h1 className="text-xl font-semibold">Profile Not Found</h1>
          </CardHeader>
          <CardBody>
            <p>Failed to load user data</p>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <UserFullProfile user={user} />
    </div>
  );
} 