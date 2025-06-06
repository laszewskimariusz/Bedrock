import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Sprawdź zmienne środowiskowe po stronie serwera
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set' : 'Missing',
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Missing',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'Set' : 'Missing',
      NEXTAUTH_URL: process.env.NEXTAUTH_URL ? 'Set' : 'Missing',
    }

    return NextResponse.json({
      success: true,
      env,
      details: {
        RESEND_API_KEY_VALUE: process.env.RESEND_API_KEY ? 
          `${process.env.RESEND_API_KEY.substring(0, 8)}...` : 'Missing',
        NODE_ENV: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 