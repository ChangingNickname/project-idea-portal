'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { registerWithEmail } from '@/lib/firebase/auth';
import Link from 'next/link';
import { Input } from '@heroui/input';
import { Button } from '@heroui/button';
import { CardBody, CardHeader } from '@heroui/card';

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters long');
        return;
      }

      const { user, error } = await registerWithEmail(email, password);
      if (error) {
        setError('Failed to create account. Please try again.');
        return;
      }

      if (user) {
        router.push('/dashboard');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <CardHeader className="flex flex-col gap-1.5 p-6">
        <h2 className="text-2xl font-semibold text-foreground">
          Create your account
        </h2>
        <p className="text-sm text-default-500">
          Enter your details to create your account
        </p>
      </CardHeader>
      <CardBody className="p-6 pt-0">
        <form className="flex flex-col gap-4" onSubmit={handleRegister}>
          <div className="flex flex-col gap-2">
            <Input
              id="email-address"
              name="email"
              type="email"
              autoComplete="email"
              required
              label="Email address"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Input
              id="confirm-password"
              name="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-danger text-sm">{error}</div>
          )}

          <Button
            type="submit"
            color="primary"
            className="w-full"
            isLoading={isLoading}
          >
            Sign up
          </Button>

          <div className="text-sm text-center">
            <Link href="/login" className="text-primary hover:text-primary-500">
              Already have an account? Sign in
            </Link>
          </div>
        </form>
      </CardBody>
    </>
  );
} 