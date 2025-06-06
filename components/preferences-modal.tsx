"use client"

import React, { useState, useEffect } from 'react'
import { X, Monitor, Moon, Sun } from 'lucide-react'
import { Button } from './ui/button'

interface PreferencesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PreferencesModal({ isOpen, onClose }: PreferencesModalProps) {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | 'system' | null
    if (stored) {
      setTheme(stored)
    } else {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      setTheme('system')
      applyTheme('system', systemTheme)
    }
    setMounted(true)
  }, [])

  const applyTheme = (themeChoice: 'light' | 'dark' | 'system', systemTheme?: 'light' | 'dark') => {
    const html = document.documentElement
    
    if (themeChoice === 'system') {
      const actualTheme = systemTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      if (actualTheme === 'dark') {
        html.classList.add('dark')
      } else {
        html.classList.remove('dark')
      }
    } else if (themeChoice === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
  }

  if (!mounted || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Preferences</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Appearance Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Appearance</h3>
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Customize how Notion looks on your device
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2">Theme</div>
              
              {/* Theme Options */}
              <div className="grid grid-cols-3 gap-2">
                {/* Light Theme */}
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`
                    flex flex-col items-center p-3 border rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800
                    ${theme === 'light' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <Sun className="h-4 w-4 mb-2 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Light</span>
                </button>

                {/* Dark Theme */}
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`
                    flex flex-col items-center p-3 border rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800
                    ${theme === 'dark' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <Moon className="h-4 w-4 mb-2 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">Dark</span>
                </button>

                {/* System Theme */}
                <button
                  onClick={() => handleThemeChange('system')}
                  className={`
                    flex flex-col items-center p-3 border rounded-lg transition-all hover:bg-gray-100 dark:hover:bg-gray-800
                    ${theme === 'system' 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : 'border-gray-200 dark:border-gray-700'
                    }
                  `}
                >
                  <Monitor className="h-4 w-4 mb-2 text-gray-700 dark:text-gray-300" />
                  <span className="text-xs text-gray-700 dark:text-gray-300">System</span>
                </button>
              </div>
            </div>
          </div>

          {/* Language & Time Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Language & Time</h3>
            
            <div className="space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Language</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">English</div>
              </div>
              
              <div>
                <div className="text-xs font-medium text-gray-900 dark:text-gray-100 mb-1">Start week on Monday</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">This will change how all calendars in your app look</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="default" size="sm">
            Done
          </Button>
        </div>
      </div>
    </div>
  )
} 