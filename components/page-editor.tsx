"use client"

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ArrowLeft, Save, Share2, MoreHorizontal, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../app/lib/auth-context'
import BlockEditor, { Block } from './block-editor'

interface PageEditorProps {
  pageId: string
}

interface PageData {
  id: string
  title: string
  emoji: string
  blocks: Block[]
  lastSaved: string
  createdBy?: string
}

export default function PageEditor({ pageId }: PageEditorProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('📝')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)

  // Auto-save functionality
  useEffect(() => {
    const saveTimeout = setTimeout(() => {
      if (title || blocks.length > 0) {
        savePageToLocal()
      }
    }, 1000)

    return () => clearTimeout(saveTimeout)
  }, [title, emoji, blocks])

  // Load page from localStorage on mount
  useEffect(() => {
    const savedPage = localStorage.getItem(`page-${pageId}`)
    if (savedPage) {
      try {
        const parsed: PageData = JSON.parse(savedPage)
        setTitle(parsed.title || '')
        setEmoji(parsed.emoji || '📝')
        setBlocks(parsed.blocks || [])
        setLastSaved(new Date(parsed.lastSaved))
      } catch (error) {
        console.error('Error parsing page data:', error)
        // Initialize with empty blocks if parsing fails
        setBlocks([])
      }
    } else {
      // Initialize with one empty paragraph block for new pages
      const initialBlock: Block = {
        id: `block-${Date.now()}`,
        type: 'paragraph',
        content: [{
          type: 'text',
          text: {
            content: '',
            link: null
          }
        }],
        children: [],
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString()
      }
      setBlocks([initialBlock])
    }
  }, [pageId])

  const savePageToLocal = () => {
    setIsSaving(true)
    const pageData: PageData = {
      id: pageId,
      title: title || 'Untitled',
      emoji,
      blocks,
      lastSaved: new Date().toISOString(),
      createdBy: user?.id
    }
    
    localStorage.setItem(`page-${pageId}`, JSON.stringify(pageData))
    setLastSaved(new Date())
    setIsSaving(false)
  }

  const formatLastSaved = () => {
    if (!lastSaved) return ''
    const now = new Date()
    const diffMs = now.getTime() - lastSaved.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Saved a few seconds ago'
    if (diffMins === 1) return 'Saved 1 minute ago'
    if (diffMins < 60) return `Saved ${diffMins} minutes ago`
    
    return `Saved at ${lastSaved.toLocaleTimeString()}`
  }

  const goBack = () => {
    router.push('/dashboard')
  }

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
  }

  const handleBlocksChange = (newBlocks: Block[]) => {
    // Zawsze musi być co najmniej jeden blok
    if (newBlocks.length === 0) {
      const emptyBlock: Block = {
        id: `block-${Date.now()}`,
        type: 'paragraph',
        content: [{
          type: 'text',
          text: {
            content: '',
            link: null
          }
        }],
        children: [],
        created_time: new Date().toISOString(),
        last_edited_time: new Date().toISOString()
      }
      setBlocks([emptyBlock])
    } else {
      setBlocks(newBlocks)
    }
  }

  const popularEmojis = ['📝', '📚', '💡', '🚀', '📊', '✅', '🎯', '💼', '🔖', '🗂️', '📋', '🎨']

  return (
    <div className="h-screen bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
      {/* Header - Notion Style */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={goBack}
                className="gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 h-8 px-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm">Back</span>
              </Button>
              
              {lastSaved && (
                <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                  {isSaving ? 'Saving...' : formatLastSaved()}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 px-2"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm">Share</span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 h-8 w-8 p-0"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Editor/Preview - Notion Style */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <div className="space-y-4">
          {/* Emoji Picker */}
          <div className="flex items-center gap-3 mb-6">
            <button 
              className="text-4xl hover:bg-gray-100 rounded-lg p-2 transition-colors"
              onClick={() => {
                // Simple emoji rotation for demo
                const currentIndex = popularEmojis.indexOf(emoji)
                const nextIndex = (currentIndex + 1) % popularEmojis.length
                setEmoji(popularEmojis[nextIndex])
              }}
              title="Click to change emoji"
            >
              {emoji}
            </button>
          </div>

          {/* Title */}
          <div className="mb-8">
            <input
              type="text"
              value={title}
              onChange={handleTitleChange}
              placeholder="Untitled"
              className="w-full text-4xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none bg-transparent"
              style={{ 
                fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
                lineHeight: '1.2'
              }}
            />
          </div>

          {/* Content Editor/Viewer */}
          <div className="relative">
            <BlockEditor
              pageId={pageId}
              initialBlocks={blocks}
              onChange={handleBlocksChange}
            />
          </div>

          {/* Page Info Footer */}
          <div className="pt-16 text-center">
            <div className="inline-flex items-center gap-4 text-xs text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
              <span>Page ID: {pageId}</span>
              <span>•</span>
              <span>{blocks.length} blocks</span>
              <span>•</span>
              <span>Auto-saved</span>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 