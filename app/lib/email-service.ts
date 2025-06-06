import { resend } from './resend'

export async function sendWelcomeEmail(email: string, firstName: string) {
  try {
    // Send to actual user's email
    const targetEmail = email
    
    const { data, error } = await resend.emails.send({
      from: 'noreply@zatto-lab.cloud',
      to: [targetEmail],
      subject: 'Welcome to Bedrock! 🎉',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Bedrock</title>
          <!--[if mso]>
          <noscript>
            <xml>
              <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
          </noscript>
          <![endif]-->
        </head>
        <body style="margin: 0; padding: 0; background-color: #f7f8fc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 10px 25px rgba(0,0,0,0.1); border-radius: 12px; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            
            <!-- Header with modern gradient -->
            <div style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%); padding: 60px 40px; text-align: center; position: relative;">
              <div style="background: rgba(255,255,255,0.1); width: 80px; height: 80px; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(10px);">
                <div style="font-size: 36px; color: white;">🏗️</div>
              </div>
              <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">Welcome to Bedrock!</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 18px; font-weight: 400;">Your connected workspace awaits</p>
            </div>
            
            <!-- Main content -->
            <div style="padding: 50px 40px;">
              <div style="text-align: center; margin-bottom: 40px;">
                <h2 style="color: #1a1a1a; margin: 0 0 12px; font-size: 28px; font-weight: 600; line-height: 1.2;">Hi ${firstName}! 👋</h2>
                <p style="color: #6b7280; font-size: 18px; margin: 0; line-height: 1.5;">Thanks for joining our community of builders and creators</p>
              </div>
              

              
              <!-- Features grid -->
              <div style="margin: 40px 0;">
                <h3 style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 24px; text-align: center;">What you can do with Bedrock:</h3>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 30px 0;">
                  <div style="background: #f8fafc; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 32px; margin-bottom: 12px;">✍️</div>
                    <h4 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Write & Plan</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.4;">Organize thoughts and create beautiful docs</p>
                  </div>
                  
                  <div style="background: #f8fafc; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 32px; margin-bottom: 12px;">🤝</div>
                    <h4 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Collaborate</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.4;">Work seamlessly with your team</p>
                  </div>
                  
                  <div style="background: #f8fafc; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 32px; margin-bottom: 12px;">📊</div>
                    <h4 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Track Progress</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.4;">Create databases and manage tasks</p>
                  </div>
                  
                  <div style="background: #f8fafc; padding: 24px; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0;">
                    <div style="font-size: 32px; margin-bottom: 12px;">🔗</div>
                    <h4 style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 8px;">Connect Tools</h4>
                    <p style="color: #64748b; font-size: 14px; margin: 0; line-height: 1.4;">Integrate all your workflows</p>
                  </div>
                </div>
              </div>
              
              <!-- Call to action -->
              <div style="text-align: center; margin: 50px 0 40px;">
                <a href="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard" 
                   style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; display: inline-block; box-shadow: 0 4px 14px 0 rgba(79, 70, 229, 0.3); transition: transform 0.2s;">
                  🚀 Start Building
                </a>
              </div>
              
              <!-- Quick tips -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 30px; border-radius: 12px; margin: 40px 0; border-left: 4px solid #0ea5e9;">
                <h4 style="color: #0c4a6e; font-size: 18px; font-weight: 600; margin: 0 0 16px; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">💡</span> Quick Tips to Get Started:
                </h4>
                <ul style="color: #0c4a6e; margin: 0; padding-left: 20px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Create your first workspace</li>
                  <li style="margin-bottom: 8px;">Invite team members to collaborate</li>
                  <li style="margin-bottom: 8px;">Try creating a page with different content blocks</li>
                  <li>Explore templates to jumpstart your projects</li>
                </ul>
              </div>
              
              <!-- Support section -->
              <div style="background: #fafafa; padding: 30px; border-radius: 12px; text-align: center; border: 1px solid #e5e5e5;">
                <h4 style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 12px;">Need Help? We're Here! 🙋‍♀️</h4>
                <p style="color: #6b7280; font-size: 15px; margin: 0 0 20px; line-height: 1.5;">
                  Our team is always ready to help you get the most out of Bedrock.
                </p>
                <a href="mailto:support@bedrock.com" style="color: #4f46e5; text-decoration: none; font-weight: 500; font-size: 15px;">
                  📧 support@bedrock.com
                </a>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 40px; text-align: center; border-top: 1px solid #e2e8f0;">
              <div style="margin-bottom: 20px;">
                <a href="#" style="color: #6b7280; text-decoration: none; font-size: 14px; margin: 0 15px;">Help Center</a>
                <a href="#" style="color: #6b7280; text-decoration: none; font-size: 14px; margin: 0 15px;">Community</a>
                <a href="#" style="color: #6b7280; text-decoration: none; font-size: 14px; margin: 0 15px;">Updates</a>
              </div>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © 2024 Bedrock. Crafted with ❤️ for builders and creators.
              </p>
              <p style="color: #d1d5db; font-size: 11px; margin: 8px 0 0;">
                You're receiving this because you signed up for Bedrock. 
                <a href="#" style="color: #6b7280; text-decoration: underline;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    })

    if (error) {
      console.error('❌ Failed to send welcome email:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error: any) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error.message }
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  try {
    // Send to actual user's email since domain is verified
    const targetEmail = email
    
    const { data, error } = await resend.emails.send({
      from: 'Bedrock <support@zatto-lab.cloud>',
      to: [targetEmail],
      subject: 'Reset your Bedrock password',
      html: `
        <div style="max-width: 600px; margin: 0 auto; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <div style="padding: 40px 30px; background: #ffffff;">
            <h2 style="color: #333; margin-top: 0;">Reset your password</h2>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              We received a request to reset your password for your Bedrock account.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetLink}" 
                 style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 16px;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin-top: 30px;">
              This link will expire in 24 hours for security reasons.
            </p>
          </div>
        </div>
      `,
    })

    if (error) {
      console.error('Failed to send password reset email:', error)
      return { success: false, error: error.message }
    }

    
    return { success: true, data }
  } catch (error: any) {
    console.error('Error sending password reset email:', error)
    return { success: false, error: error.message }
  }
} 