import { NextResponse } from 'next/server'
import { getResendDomains } from '../../lib/test-resend'

export async function GET() {
  try {
    const result = await getResendDomains()
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error testing domains:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 