'use client';

import { useEffect, useState } from 'react';
import { User } from '@/types/user';
import { UserFullProfile } from '@/components/user/UserFullProfile';
import { Card, CardHeader, CardBody } from "@heroui/card";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch('/api/user/me');
        if (!response.ok) {
          throw new Error('Failed to load user data');
        }
        const data = await response.json();
        setUser(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchUserData();
  }, []);

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