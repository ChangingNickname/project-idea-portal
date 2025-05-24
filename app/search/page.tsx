'use client';

import React, { useState } from 'react';
import { User } from '@/types/user';
import { Card, CardBody, CardHeader } from "@heroui/card";
import { UserSearch } from '@/components/user-search';

export default function SearchPage() {
  const [error, setError] = useState<string | null>(null);

  const handleUserSelect = (users: User[]) => {
    // Handle user selection if needed
    console.log('Selected users:', users);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">User Search</h1>
        </CardHeader>
        <CardBody>
          {error && (
            <div className="text-danger mb-4">{error}</div>
          )}
          
          <UserSearch
            onSelect={handleUserSelect}
            maxUsers={10}
            placeholder="Search by name or email..."
          />
        </CardBody>
      </Card>
    </div>
  );
} 