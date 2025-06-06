"use client"

import { useState } from 'react'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { testDatabaseConnection, testSupabaseAuth, createAppTables } from '../lib/test-connection'
import { CheckCircle, XCircle, Loader, Mail, Settings } from 'lucide-react'

export default function TestDatabasePage() {
  const [dbResult, setDbResult] = useState<any>(null)
  const [authResult, setAuthResult] = useState<any>(null)
  const [resendResult, setResendResult] = useState<any>(null)
  const [domainsResult, setDomainsResult] = useState<any>(null)
  const [serverEnvResult, setServerEnvResult] = useState<any>(null)
  const [tablesResult, setTablesResult] = useState<any>(null)
  const [loading, setLoading] = useState({ db: false, auth: false, resend: false, domains: false, tables: false })

  const testDbConnection = async () => {
    setLoading({ ...loading, db: true })
    const result = await testDatabaseConnection()
    setDbResult(result)
    setLoading({ ...loading, db: false })
  }

  const testAuth = async () => {
    setLoading({ ...loading, auth: true })
    const result = await testSupabaseAuth()
    setAuthResult(result)
    setLoading({ ...loading, auth: false })
  }

  const testResend = async () => {
    setLoading({ ...loading, resend: true })
    try {
      const response = await fetch('/api/test-resend', { method: 'POST' })
      const result = await response.json()
      setResendResult(result)
    } catch (error: any) {
      setResendResult({ success: false, error: error.message })
    }
    setLoading({ ...loading, resend: false })
  }

  const checkServerEnv = async () => {
    try {
      const response = await fetch('/api/test-env')
      const result = await response.json()
      console.log('Server environment:', result)
      setServerEnvResult(result)
      return result
    } catch (error) {
      console.error('Failed to check server environment:', error)
      setServerEnvResult({ success: false, error: 'Failed to check server environment' })
      return null
    }
  }

  const testDomains = async () => {
    setLoading({ ...loading, domains: true })
    
    try {
      const response = await fetch('/api/test-domains')
      const result = await response.json()
      setDomainsResult(result)
    } catch (error: any) {
      setDomainsResult({ success: false, error: error.message })
    }
    
    setLoading({ ...loading, domains: false })
  }

  const createTables = async () => {
    setLoading({ ...loading, tables: true })
    const result = await createAppTables()
    setTablesResult(result)
    setLoading({ ...loading, tables: false })
    // Odśwież również test połączenia z bazą
    if (result.success) {
      testDbConnection()
    }
  }

  return (
    <div className="container mx-auto p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Database Connection Test</h1>
          <p className="text-muted-foreground">
            Test your connection to Supabase database and authentication services.
          </p>
        </div>

        {/* Manual Database Setup Instructions */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">🚀 Database Setup Required</CardTitle>
          </CardHeader>
          <CardContent className="text-orange-700">
            <p className="mb-4">
              Your Supabase project needs application tables. Follow these steps:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to your <a href="https://supabase.com/dashboard" target="_blank" className="text-blue-600 underline">Supabase Dashboard</a></li>
              <li>Select your project: <strong>zuipckenhdcbzhtyjhpl</strong></li>
              <li>Go to <strong>SQL Editor</strong> in the sidebar</li>
              <li>Create a new query and paste the SQL script from the "Create Tables" result below</li>
              <li>Run the script to create profiles, workspaces, and pages tables</li>
              <li>Return here and test the connection</li>
            </ol>
          </CardContent>
        </Card>

        {/* Database Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Database Connection
              {dbResult && (
                dbResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Button 
                onClick={testDbConnection} 
                disabled={loading.db}
                className="w-full"
              >
                {loading.db ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>

              <Button 
                onClick={createTables} 
                disabled={loading.tables}
                variant="outline"
                className="w-full"
              >
                {loading.tables ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Tables'
                )}
              </Button>
            </div>
            
            {dbResult && (
              <div className={`p-3 rounded-lg ${
                dbResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <p className="font-medium">
                  {dbResult.success ? 'Connection Successful!' : 'Connection Failed'}
                </p>
                {dbResult.error && (
                  <p className="text-sm mt-1">Error: {dbResult.error}</p>
                )}
                {dbResult.tables && (
                  <div className="text-sm mt-2">
                    <p className="font-medium">Available tables ({dbResult.tables.length}):</p>
                    {dbResult.tables.length > 0 ? (
                      <ul className="list-disc list-inside">
                        {dbResult.tables.map((table: any, index: number) => (
                          <li key={index}>{table.table_name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-orange-600">No tables found. Click 'Create Tables' to set up the database.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {tablesResult && (
              <div className={`p-3 rounded-lg ${
                tablesResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <p className="font-medium">
                  {tablesResult.success ? 'Tables Created Successfully!' : 'Failed to Create Tables'}
                </p>
                {tablesResult.error && (
                  <p className="text-sm mt-1">Error: {tablesResult.error}</p>
                )}
                {tablesResult.message && (
                  <p className="text-sm mt-1">{tablesResult.message}</p>
                )}
                {tablesResult.sql && (
                  <div className="mt-3">
                    <p className="font-medium text-sm mb-2">SQL Script to run in Supabase Dashboard:</p>
                    <pre className="text-xs bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
                      {tablesResult.sql}
                    </pre>
                    <p className="text-xs mt-2 text-blue-600">
                      Copy this script and run it in Supabase Dashboard → SQL Editor
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Auth Service Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Authentication Service
              {authResult && (
                authResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={testAuth} 
              disabled={loading.auth}
              className="w-full"
            >
              {loading.auth ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Authentication Service'
              )}
            </Button>
            
            {authResult && (
              <div className={`p-3 rounded-lg ${
                authResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <p className="font-medium">
                  {authResult.success ? 'Auth Service Working!' : 'Auth Service Failed'}
                </p>
                {authResult.error && (
                  <p className="text-sm mt-1">Error: {authResult.error}</p>
                )}
                {authResult.session && (
                  <p className="text-sm mt-1">
                    Current session: {authResult.session ? 'Active' : 'None'}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resend Email Service Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Resend Email Service
              {resendResult && (
                resendResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Button 
                onClick={testResend} 
                disabled={loading.resend}
                className="w-full"
              >
                {loading.resend ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Test Email'
                )}
              </Button>
              
              <Button 
                onClick={testDomains} 
                disabled={loading.domains}
                variant="outline"
                className="w-full"
              >
                {loading.domains ? (
                  <>
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Check Domains'
                )}
              </Button>

              <Button 
                onClick={checkServerEnv} 
                variant="ghost"
                className="w-full"
              >
                Check Server Env
              </Button>
            </div>
            
            {resendResult && (
              <div className={`p-3 rounded-lg ${
                resendResult.success 
                  ? 'bg-green-50 text-green-800 border border-green-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <p className="font-medium">
                  {resendResult.success ? 'Email Sent Successfully!' : 'Email Failed'}
                </p>
                {resendResult.error && (
                  <p className="text-sm mt-1">Error: {resendResult.error}</p>
                )}
                {resendResult.data && (
                  <p className="text-sm mt-1">Email ID: {resendResult.data.id}</p>
                )}
              </div>
            )}

            {domainsResult && (
              <div className={`p-3 rounded-lg ${
                domainsResult.success 
                  ? 'bg-blue-50 text-blue-800 border border-blue-200' 
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <p className="font-medium">
                  {domainsResult.success ? 'Domains Retrieved!' : 'Failed to get domains'}
                </p>
                {domainsResult.error && (
                  <p className="text-sm mt-1">Error: {domainsResult.error}</p>
                )}
                {domainsResult.domains && domainsResult.domains.length > 0 && (
                  <div className="text-sm mt-1">
                    <p>Configured domains:</p>
                    <ul className="list-disc list-inside">
                      {domainsResult.domains.map((domain: any, index: number) => (
                        <li key={index}>{domain.name} - {domain.status}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {domainsResult.domains && domainsResult.domains.length === 0 && (
                  <p className="text-sm mt-1">No domains configured. Using default resend.dev domain.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables Check */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Environment Variables
            </CardTitle>
          </CardHeader>
          <CardContent>
            {serverEnvResult ? (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${
                  serverEnvResult.success 
                    ? 'bg-green-50 text-green-800 border border-green-200' 
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  <p className="font-medium">
                    {serverEnvResult.success ? 'Environment Configuration OK' : 'Environment Issues Found'}
                  </p>
                  <p className="text-sm mt-1">
                    {serverEnvResult.env?.set || 0}/{serverEnvResult.env?.total || 0} variables set
                  </p>
                </div>

                {serverEnvResult.details && (
                  <div className="space-y-2 text-sm">
                    {Object.entries(serverEnvResult.details).map(([key, status]) => (
                      <div key={key} className="flex justify-between items-center">
                        <div>
                          <span className="font-mono">{key}:</span>
                        </div>
                        <span className={`font-medium ${
                          status === 'set' ? 'text-green-600' : 'text-orange-600'
                        }`}>
                          {status === 'set' ? '✓ Set' : '- Optional'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <Button onClick={checkServerEnv} variant="outline">
                  Check Environment Variables
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 