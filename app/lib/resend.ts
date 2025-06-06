import { Resend } from 'resend';

// Sprawdź czy klucz API jest dostępny
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  console.warn('RESEND_API_KEY not found in environment variables');
}

export const resend = new Resend(apiKey || 'dummy-key-for-development');
