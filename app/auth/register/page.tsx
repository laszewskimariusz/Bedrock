'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '../../lib/supabase';
import { resend } from '../../lib/resend';
import { Button } from '../../../components/ui/button';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setError(error.message);
    } else {
      await resend.emails.send({
        from: 'onboarding@bedrock.app',
        to: email,
        subject: 'Welcome to Bedrock',
        html: '<p>Thanks for registering!</p>',
      });
      location.href = '/auth/login';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        <h2 className="text-2xl font-bold">Register</h2>
        <input
          className="w-full border p-2"
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full border p-2"
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-500">{error}</p>}
        <Button className="w-full" type="submit">
          Register
        </Button>
        <p className="text-sm text-center">
          Already have an account?{' '}
          <Link href="/auth/login" className="underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
