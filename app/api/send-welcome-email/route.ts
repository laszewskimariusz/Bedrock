import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '../../lib/email-service'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Received request body:', body)
    
    const { email, firstName } = body

    if (!email || !firstName) {
      console.log('Missing email or firstName:', { email, firstName })
      return NextResponse.json({
        success: false,
        error: 'Email and firstName are required'
      }, { status: 400 })
    }

    const result = await sendWelcomeEmail(email, firstName)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome email sent successfully'
    })

  } catch (error: any) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 