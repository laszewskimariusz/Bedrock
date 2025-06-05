import Link from 'next/link';
import { Button } from '../components/ui/button';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center space-y-6 p-24">
      <h1 className="text-4xl font-bold">Welcome to Bedrock</h1>
      <div className="space-x-4">
        <Link href="/auth/login">
          <Button>Login</Button>
        </Link>
        <Link href="/auth/register">
          <Button variant="outline">Register</Button>
        </Link>
      </div>
    </main>
  );
}
