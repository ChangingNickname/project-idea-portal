import LoginForm from '@/components/auth/LoginForm';
import { Card } from '@heroui/card';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <LoginForm />
      </Card>
    </div>
  );
} 