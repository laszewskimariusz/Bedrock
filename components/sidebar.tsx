"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { Dropdown, DropdownItem, DropdownSeparator } from './ui/dropdown'
import { useAuth } from '../app/lib/auth-context'
import PreferencesModal from './preferences-modal'
import { 
  Search, 
  Settings, 
  Plus, 
  FileText, 
  Calendar, 
  Users, 
  ChevronDown,
  ChevronRight,
  MoreHorizontal,
  LogOut,
  Clock,
  Star,
  Trash2,
  User,
  Palette
} from 'lucide-react'

export default function Sidebar() {
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true)
  const [recentPages, setRecentPages] = useState<any[]>([])
  const [isPreferencesOpen, setIsPreferencesOpen] = useState(false)
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const getInitials = (user: any) => {
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name[0]}${user.user_metadata.last_name[0]}`
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const getDisplayName = (user: any) => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
    }
    if (user?.user_metadata?.first_name && user?.user_metadata?.last_name) {
      return `${user.user_metadata.first_name} ${user.user_metadata.last_name}`
    }
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'User'
  }

  // Load recent pages from localStorage
  useEffect(() => {
    const loadRecentPages = () => {
      const pages = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('page-')) {
          try {
            const pageData = JSON.parse(localStorage.getItem(key) || '{}')
            pages.push({
              id: pageData.id,
              title: pageData.title || 'Untitled',
              lastSaved: new Date(pageData.lastSaved),
              emoji: '📝'
            })
          } catch (error) {
            console.error('Error parsing page data:', error)
          }
        }
      }
      
      // Sort by last saved date
      pages.sort((a, b) => b.lastSaved.getTime() - a.lastSaved.getTime())
      setRecentPages(pages.slice(0, 5)) // Show only 5 most recent
    }

    loadRecentPages()
    
    // Refresh when returning from page editor
    const handleFocus = () => loadRecentPages()
    window.addEventListener('focus', handleFocus)
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const createNewPage = async () => {
    try {
      const pageId = Date.now().toString()
      router.push(`/page/${pageId}`)
    } catch (error) {
      console.error('Error creating page:', error)
    }
  }

  return (
    <div className="flex h-full w-64 flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* User Profile - Notion Style with Dropdown */}
      <div className="p-3">
        <Dropdown
          trigger={
            <div className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md cursor-pointer group w-full">
              <Avatar className="h-6 w-6">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200">{getInitials(user)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{getDisplayName(user)}</p>
              </div>
              <ChevronDown className="h-3 w-3 text-gray-500 dark:text-gray-400" />
            </div>
          }
          align="left"
        >
          <DropdownItem 
            icon={<User className="h-4 w-4" />}
            onClick={() => {/* TODO: Profile settings */}}
          >
            My account
          </DropdownItem>
          <DropdownItem 
            icon={<Palette className="h-4 w-4" />}
            onClick={() => setIsPreferencesOpen(true)}
          >
            Preferences
          </DropdownItem>
          <DropdownSeparator />
          <DropdownItem 
            icon={<LogOut className="h-4 w-4" />}
            onClick={handleSignOut}
          >
            Log out
          </DropdownItem>
        </Dropdown>
      </div>

      {/* Quick Actions - Notion Style */}
      <div className="px-2 py-1 space-y-0.5">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
        >
          <Search className="h-4 w-4" />
          Search
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">⌘K</span>
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
          onClick={() => router.push('/dashboard')}
        >
          <span className="text-sm">🏠</span>
          Home
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
        >
          <Settings className="h-4 w-4" />
          Settings & members
        </Button>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

      {/* Workspace Section - Notion Style */}
      <div className="flex-1 overflow-y-auto px-2">
        <div className="space-y-0.5">
          <div className="flex items-center w-full h-6 px-1">
            <Button
              variant="ghost"
              className="flex-1 justify-start gap-1 h-6 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 px-1"
              onClick={() => setIsWorkspaceOpen(!isWorkspaceOpen)}
            >
              {isWorkspaceOpen ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Private
            </Button>
            <button 
              className="h-4 w-4 p-0 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex items-center justify-center"
              onClick={(e) => {
                e.stopPropagation()
                createNewPage()
              }}
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          {isWorkspaceOpen && (
            <div className="space-y-0.5 pl-3">
              {/* Recent Pages */}
              {recentPages.map((page, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
                  onClick={() => router.push(`/page/${page.id}`)}
                >
                  <span className="text-sm">{page.emoji}</span>
                  <span className="truncate">{page.title}</span>
                </Button>
              ))}
              
              {/* Template Pages */}
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
              >
                <span className="text-sm">📖</span>
                Getting Started
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
              >
                <span className="text-sm">📅</span>
                Calendar
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
              >
                <span className="text-sm">📋</span>
                Templates
              </Button>
            </div>
          )}
        </div>

        {/* Add Page Button */}
        <div className="mt-4">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
            onClick={createNewPage}
          >
            <Plus className="h-4 w-4" />
            Add a page
          </Button>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-2">
        <Button 
          variant="ghost" 
          className="w-full justify-start gap-2 h-7 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-normal"
        >
          <Trash2 className="h-4 w-4" />
          Trash
        </Button>
      </div>

      {/* Preferences Modal */}
      <PreferencesModal 
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
      />
    </div>
  )
} 