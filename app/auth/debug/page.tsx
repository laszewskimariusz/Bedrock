"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { supabase } from '../../lib/supabase'

export default function AuthDebugPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [authStatus, setAuthStatus] = useState<string>('Checking...')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`${timestamp}: ${message}`, ...prev.slice(0, 9)])
  }

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      addLog('Checking current session...')
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        addLog(`Session error: ${error.message}`)
        setAuthStatus('Error getting session')
        return
      }

      if (session) {
        addLog(`User logged in: ${session.user.email}`)
        setCurrentUser(session.user)
        setAuthStatus('Logged in')
      } else {
        addLog('No active session')
        setAuthStatus('Not logged in')
      }
    } catch (error: any) {
      addLog(`Auth check error: ${error.message}`)
      setAuthStatus('Error')
    }
  }

  const testConnection = async () => {
    try {
      addLog('Testing Supabase connection...')
      const { data, error } = await supabase.from('profiles').select('*').limit(1)
      
      if (error) {
        addLog(`Connection test failed: ${error.message}`)
      } else {
        addLog('Connection test successful')
      }
    } catch (error: any) {
      addLog(`Connection error: ${error.message}`)
    }
  }

  const testLogin = async () => {
    const testEmail = "test@example.com"
    const testPassword = "password123"
    
    try {
      addLog(`Testing login with ${testEmail}...`)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      })

      if (error) {
        addLog(`Login test failed: ${error.message}`)
      } else {
        addLog('Login test successful')
        setCurrentUser(data.user)
      }
    } catch (error: any) {
      addLog(`Login test error: ${error.message}`)
    }
  }

  const signOut = async () => {
    try {
      addLog('Signing out...')
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        addLog(`Sign out error: ${error.message}`)
      } else {
        addLog('Signed out successfully')
        setCurrentUser(null)
        setAuthStatus('Not logged in')
      }
    } catch (error: any) {
      addLog(`Sign out error: ${error.message}`)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Auth Debug Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Auth Status:</strong> {authStatus}
            </div>
            <div>
              <strong>Current User:</strong> {currentUser?.email || 'None'}
            </div>
            <div>
              <strong>User ID:</strong> {currentUser?.id || 'None'}
            </div>
            <div>
              <strong>Email Confirmed:</strong> {currentUser?.email_confirmed_at ? 'Yes' : 'No'}
            </div>
            
            <div className="space-y-2">
              <Button onClick={checkAuthStatus} className="w-full">
                Refresh Status
              </Button>
              <Button onClick={testConnection} variant="outline" className="w-full">
                Test Connection
              </Button>
              <Button onClick={testLogin} variant="outline" className="w-full">
                Test Login
              </Button>
              {currentUser && (
                <Button onClick={signOut} variant="outline" className="w-full">
                  Sign Out
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono bg-muted p-2 rounded">
                  {log}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Environment Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Environment Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Supabase URL:</strong><br />
              <code className="text-xs">{process.env.NEXT_PUBLIC_SUPABASE_URL}</code>
            </div>
            <div>
              <strong>Anon Key (first 20 chars):</strong><br />
              <code className="text-xs">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20)}...
              </code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 