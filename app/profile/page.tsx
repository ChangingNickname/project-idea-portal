'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile/me');
  }, [router]);

  return null;
} 