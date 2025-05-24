'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signInWithEmail, signInWithGoogle, signInAnonymouslyUser } from '@/lib/firebase/auth';
import { User } from 'firebase/auth';
import { Card, CardBody, CardHeader, CardFooter } from '@heroui/card';
import { Button } from '@heroui/button';
import { Input } from '@heroui/input';
import { Divider } from '@heroui/divider';
import { Spinner } from '@heroui/spinner';

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      router.push('/dashboard');
    }
  }, [router]);

  const storeUserAndRedirect = async (user: User) => {
    const userData = {
      email: user.email,
      uid: user.uid,
      displayName: user.displayName,
      photoURL: user.photoURL,
      isAnonymous: user.isAnonymous,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    };
    
    // Get the ID token
    const idToken = await user.getIdToken();
    
    // Create session cookie
    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to create session');
    }
    
    localStorage.setItem('user', JSON.stringify(userData));
    // Trigger storage event to update UserMenu
    window.dispatchEvent(new Event('storage'));
    router.push('/dashboard');
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const { user, error } = await signInWithEmail(email, password);
      if (error) {
        setError('Failed to login. Please check your credentials.');
        return;
      }
      
      if (user) {
        await storeUserAndRedirect(user);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { user, error } = await signInWithGoogle();
      if (error) {
        setError('Failed to login with Google.');
        return;
      }
      
      if (user) {
        await storeUserAndRedirect(user);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnonymousLogin = async () => {
    setError('');
    setLoading(true);
    
    try {
      const { user, error } = await signInAnonymouslyUser();
      if (error) {
        setError('Failed to login anonymously.');
        return;
      }
      
      if (user) {
        await storeUserAndRedirect(user);
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md w-full mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center">
          Sign in to your account
        </h2>
      </CardHeader>
      
      <CardBody>
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <Input
            type="email"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="Enter your email"
          />
          
          <Input
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
          />

          {error && (
            <div className="text-danger text-sm text-center">{error}</div>
          )}

          <Button
            type="submit"
            variant="solid"
            className="w-full"
            isLoading={loading}
          >
            Sign in
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="bordered"
            onClick={handleGoogleLogin}
            isLoading={loading}
            className="w-full"
          >
            Google
          </Button>
          
          <Button
            variant="bordered"
            onClick={handleAnonymousLogin}
            isLoading={loading}
            className="w-full"
          >
            Anonymous
          </Button>
        </div>
      </CardBody>

      <CardFooter className="justify-center">
        <Link 
          href="/register" 
          className="text-sm text-primary hover:text-primary-dark"
        >
          Don't have an account? Sign up
        </Link>
      </CardFooter>
    </Card>
  );
} 