"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Plus, Calendar, FileText, Users, Bookmark, Clock, Star, Search } from 'lucide-react'
import { useAuth } from '../app/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createPageTemplate } from '../app/lib/block-utils'
import { Block } from './block-editor'

interface PageData {
  id: string
  title: string
  emoji: string
  blocks: Block[]
  lastSaved: string
  createdBy?: string
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [isCreatingPage, setIsCreatingPage] = useState(false)
  const [recentPages, setRecentPages] = useState<PageData[]>([])


  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  const getDisplayName = (user: any) => {
    if (user?.user_metadata?.first_name) {
      return user.user_metadata.first_name
    }
    if (user?.email) {
      return user.email.split('@')[0]
    }
    return 'there'
  }

  const createNewPage = async (templateType?: 'meeting' | 'project' | 'daily' | 'notes') => {
    setIsCreatingPage(true)
    try {
      const pageId = Date.now().toString()
      
      // If template is specified, pre-populate with template blocks
      if (templateType) {
        const templateBlocks = createPageTemplate(templateType)
        const pageData: PageData = {
          id: pageId,
          title: getTemplateTitle(templateType),
          emoji: getTemplateEmoji(templateType),
          blocks: templateBlocks,
          lastSaved: new Date().toISOString(),
          createdBy: user?.id
        }
        
        localStorage.setItem(`page-${pageId}`, JSON.stringify(pageData))
      }
      
      router.push(`/page/${pageId}`)
    } catch (error) {
      console.error('Error creating page:', error)
      setIsCreatingPage(false)
    }
  }

  const getTemplateTitle = (templateType: string) => {
    switch (templateType) {
      case 'meeting': return 'Meeting Notes'
      case 'project': return 'Project Plan'
      case 'daily': return 'Daily Notes'
      default: return 'Untitled'
    }
  }

  const getTemplateEmoji = (templateType: string) => {
    switch (templateType) {
      case 'meeting': return '🤝'
      case 'project': return '📊'
      case 'daily': return '📅'
      default: return '📝'
    }
  }

  const formatRelativeTime = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    
    return date.toLocaleDateString()
  }

  // Load recent pages from localStorage
  useEffect(() => {
    const loadRecentPages = () => {
      const pages: PageData[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('page-')) {
          try {
            const pageData = JSON.parse(localStorage.getItem(key) || '{}')
            pages.push({
              id: pageData.id,
              title: pageData.title || 'Untitled',
              emoji: pageData.emoji || '📝',
              blocks: pageData.blocks || [],
              lastSaved: pageData.lastSaved,
              createdBy: pageData.createdBy
            })
          } catch (error) {
            console.error('Error parsing page data:', error)
          }
        }
      }
      
      // Sort by last saved date
      pages.sort((a, b) => new Date(b.lastSaved).getTime() - new Date(a.lastSaved).getTime())
      setRecentPages(pages.slice(0, 10)) // Show more recent pages
    }

    loadRecentPages()
    
    // Refresh when returning from page editor
    const handleFocus = () => loadRecentPages()
    window.addEventListener('focus', handleFocus)
    
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  const quickActions = [
    {
      title: "📝 New Page",
      description: "Start with a blank page",
      action: () => createNewPage(),
      disabled: isCreatingPage
    },
    {
      title: "🤝 Meeting Notes",
      description: "Template with agenda and action items",
      action: () => createNewPage('meeting'),
      disabled: isCreatingPage
    },
    {
      title: "📊 Project Plan",
      description: "Organize goals, timeline and tasks",
      action: () => createNewPage('project'),
      disabled: isCreatingPage
    },
    {
      title: "📅 Daily Notes",
      description: "Track daily goals and thoughts",
      action: () => createNewPage('daily'),
      disabled: isCreatingPage
    }
  ]

  // Show loading state
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-12">
        {/* Welcome Section - Notion Style */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-3 text-gray-900 dark:text-gray-100">
            {getGreeting()}, {getDisplayName(user)}! 👋
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 font-normal">
            What would you like to work on today?
          </p>
        </div>

        {/* Quick Actions - Notion Style Grid */}
        <div className="mb-12">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={action.disabled}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-1">{action.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Pages - Notion Style */}
        {recentPages.length > 0 && (
          <div className="mb-12">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recently viewed</h2>
            <div className="space-y-1">
              {recentPages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => router.push(`/page/${page.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors w-full text-left group"
                >
                  <span className="text-lg">{page.emoji}</span>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600">
                      {page.title}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {page.blocks.length} blocks • Edited {formatRelativeTime(new Date(page.lastSaved))}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty State for New Users */}
        {recentPages.length === 0 && (
          <div className="text-center py-16">
            <div className="mb-6">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Welcome to your workspace
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                This is where you'll find all your pages. Start by creating your first page above.
              </p>
            </div>
          </div>
        )}

        {/* Tips Section - Subtle */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-8">
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-6 border border-blue-100 dark:border-blue-800">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
              <span>💡</span> Block Editor Tips
            </h3>
            <div className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <p>• Type <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">/</code> to see all available block types</p>
              <p>• Press <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Enter</code> to create a new block</p>
              <p>• Use <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">Backspace</code> on empty blocks to delete them</p>
              <p>• Drag the ⋮⋮ handle to reorder blocks</p>
              <p>• Your work is automatically saved as you type</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 