export function checkEnvironmentVariables() {
  const checks = {
    NEXT_PUBLIC_SUPABASE_URL: {
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      required: true,
      description: 'Supabase project URL'
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      required: true,
      description: 'Supabase anonymous key'
    },
    RESEND_API_KEY: {
      value: process.env.RESEND_API_KEY,
      required: false,
      description: 'Resend email service API key'
    },
    DATABASE_URL: {
      value: process.env.DATABASE_URL,
      required: false,
      description: 'Direct database connection URL'
    },
    NEXTAUTH_SECRET: {
      value: process.env.NEXTAUTH_SECRET,
      required: false,
      description: 'NextAuth secret for sessions'
    },
    NEXTAUTH_URL: {
      value: process.env.NEXTAUTH_URL,
      required: false,
      description: 'Application URL'
    }
  }

  const results = Object.entries(checks).map(([key, check]) => ({
    key,
    ...check,
    status: check.value ? 'set' : 'missing',
    isValid: check.required ? !!check.value : true
  }))

  const hasErrors = results.some(r => !r.isValid)
  const missing = results.filter(r => r.required && !r.value)

  return {
    success: !hasErrors,
    results,
    missing,
    summary: {
      total: results.length,
      set: results.filter(r => r.status === 'set').length,
      missing: missing.length,
      hasErrors
    }
  }
}

export function getEnvInstructions() {
  return `
Please create a .env.local file in your project root with these variables:

# Required for Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional for email service
RESEND_API_KEY=re_your-api-key

# Optional for direct database access
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres

# Optional for NextAuth
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

Copy these values from your Supabase dashboard and Resend account.
`
} 