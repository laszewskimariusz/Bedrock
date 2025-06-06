import { resend } from './resend'

export async function testResendConnection() {
  try {
    // Test if Resend API key is configured
    
    if (!process.env.RESEND_API_KEY) {
      return { 
        success: false, 
        error: 'RESEND_API_KEY environment variable is not set. Please add it to your .env.local file' 
      }
    }

    if (process.env.RESEND_API_KEY === 'dummy-key-for-development') {
      return { 
        success: false, 
        error: 'Using dummy API key. Please set a real RESEND_API_KEY in .env.local' 
      }
    }

    // Test sending a simple email
    const { data, error } = await resend.emails.send({
      from: 'Bedrock <onboarding@resend.dev>', // Back to resend.dev for testing
      to: ['mariusz.laszewski@outlook.com'],  // Your email for testing
      subject: 'Bedrock - Test Email',
      html: '<h1>Test Email</h1><p>This is a test email from Bedrock app using verified domain!</p>',
    })

    if (error) {
      return { success: false, error: error.message || 'Unknown error' }
    }

    return { success: true, data }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getResendDomains() {
  try {
    const { data, error } = await resend.domains.list()
    
    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, domains: data?.data || [] }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
} 