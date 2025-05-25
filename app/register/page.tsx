import RegisterForm from '@/components/auth/RegisterForm';
import { Card } from '@heroui/card';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <RegisterForm />
      </Card>
    </div>
  );
} 