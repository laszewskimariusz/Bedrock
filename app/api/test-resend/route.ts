import { NextResponse } from 'next/server'
import { resend } from '../../lib/resend'

export async function POST() {
  try {
    // Sprawdź czy klucz API jest dostępny
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY environment variable is not set'
      }, { status: 400 })
    }

    // Test sending a simple email
    const { data, error } = await resend.emails.send({
      from: 'Bedrock <onboarding@resend.dev>',
      to: ['delivered@resend.dev'], // Special test address
      subject: 'Bedrock - Test Email',
      html: `
        <h1>🎉 Test Email from Bedrock</h1>
        <p>This is a test email sent from your Bedrock application!</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <p>API Key: ${process.env.RESEND_API_KEY?.substring(0, 8)}...</p>
      `,
    })

    if (error) {
      console.error('Resend API test failed:', error)
      return NextResponse.json({
        success: false,
        error: error.message || 'Unknown error'
      }, { status: 400 })
    }

    console.log('Resend API test successful!', data)
    return NextResponse.json({
      success: true,
      data,
      message: 'Test email sent successfully!'
    })

  } catch (err: any) {
    console.error('Resend API test error:', err)
    return NextResponse.json({
      success: false,
      error: err.message
    }, { status: 500 })
  }
} 