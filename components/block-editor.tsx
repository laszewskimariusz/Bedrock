"use client"

import { useState, useEffect, useRef, KeyboardEvent, DragEvent } from 'react'
import { Plus, GripVertical, MoreHorizontal, Type, Hash, List, CheckSquare, ToggleLeft } from 'lucide-react'
import { Button } from './ui/button'

// Typy bloków
export type BlockType = 
  | 'paragraph'
  | 'heading_1' 
  | 'heading_2'
  | 'heading_3'
  | 'bulleted_list_item'
  | 'numbered_list_item'
  | 'to_do'
  | 'toggle'

export interface RichText {
  type: 'text'
  text: {
    content: string
    link?: string | null
  }
  annotations?: {
    bold?: boolean
    italic?: boolean
    strikethrough?: boolean
    underline?: boolean
    code?: boolean
    color?: string
  }
}

export interface Block {
  id: string
  type: BlockType
  content: RichText[]
  children?: Block[]
  metadata?: {
    checked?: boolean // dla to_do
    level?: number    // dla nagłówków
  }
  created_time: string
  last_edited_time: string
}

interface BlockEditorProps {
  pageId: string
  initialBlocks?: Block[]
  onChange?: (blocks: Block[]) => void
}

// Funkcja do parsowania markdown w treści
function parseMarkdownFormatting(text: string): RichText[] {
  const parts: RichText[] = []
  let remaining = text
  
  // Regex patterns dla formatowania
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, annotation: 'bold' },
    { regex: /\*(.*?)\*/g, annotation: 'italic' },
    { regex: /~~(.*?)~~/g, annotation: 'strikethrough' },
    { regex: /`(.*?)`/g, annotation: 'code' },
  ]
  
  // Jeśli nie ma formatowania, zwróć prosty tekst
  if (!patterns.some(p => p.regex.test(text))) {
    return [{
      type: 'text',
      text: { content: text, link: null }
    }]
  }
  
  // Parsuj formatowanie
  let lastIndex = 0
  const allMatches: Array<{match: RegExpExecArray, type: string}> = []
  
  patterns.forEach(pattern => {
    pattern.regex.lastIndex = 0
    let match
    while ((match = pattern.regex.exec(text)) !== null) {
      allMatches.push({ match, type: pattern.annotation })
    }
  })
  
  // Sortuj matches po pozycji
  allMatches.sort((a, b) => a.match.index - b.match.index)
  
  allMatches.forEach(({ match, type }) => {
    // Dodaj tekst przed match
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index)
      if (beforeText) {
        parts.push({
          type: 'text',
          text: { content: beforeText, link: null }
        })
      }
    }
    
    // Dodaj sformatowany tekst
    parts.push({
      type: 'text',
      text: { content: match[1], link: null },
      annotations: { [type]: true }
    })
    
    lastIndex = match.index + match[0].length
  })
  
  // Dodaj pozostały tekst
  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex)
    if (remainingText) {
      parts.push({
        type: 'text',
        text: { content: remainingText, link: null }
      })
    }
  }
  
  return parts.length > 0 ? parts : [{
    type: 'text',
    text: { content: text, link: null }
  }]
}

export default function BlockEditor({ pageId, initialBlocks = [], onChange }: BlockEditorProps) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Tworzenie nowego bloku
  const createBlock = (type: BlockType = 'paragraph', content: string = ''): Block => {
    return {
      id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      content: parseMarkdownFormatting(content),
      children: [],
      metadata: type === 'to_do' ? { checked: false } : {},
      created_time: new Date().toISOString(),
      last_edited_time: new Date().toISOString()
    }
  }

  // Dodanie nowego bloku
  const addBlock = (afterIndex: number = blocks.length, type: BlockType = 'paragraph') => {
    const newBlock = createBlock(type)
    const newBlocks = [...blocks]
    newBlocks.splice(afterIndex, 0, newBlock)
    setBlocks(newBlocks)
    setFocusedBlockId(newBlock.id)
    onChange?.(newBlocks)
  }

  // Aktualizacja treści bloku z obsługą markdown
  const updateBlockContent = (blockId: string, content: string) => {
    const newBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          content: parseMarkdownFormatting(content),
          last_edited_time: new Date().toISOString()
        }
      }
      return block
    })
    setBlocks(newBlocks)
    onChange?.(newBlocks)
  }

  // Zmiana typu bloku
  const changeBlockType = (blockId: string, newType: BlockType) => {
    const newBlocks = blocks.map(block => {
      if (block.id === blockId) {
        return {
          ...block,
          type: newType,
          metadata: newType === 'to_do' ? { checked: false } : {},
          last_edited_time: new Date().toISOString()
        }
      }
      return block
    })
    setBlocks(newBlocks)
    onChange?.(newBlocks)
    setShowBlockMenu(null)
  }

  // Usuwanie bloku
  const deleteBlock = (blockId: string) => {
    const newBlocks = blocks.filter(block => block.id !== blockId)
    setBlocks(newBlocks)
    onChange?.(newBlocks)
  }

  // Przenoszenie bloku (drag & drop)
  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks]
    const [movedBlock] = newBlocks.splice(fromIndex, 1)
    newBlocks.splice(toIndex, 0, movedBlock)
    setBlocks(newBlocks)
    onChange?.(newBlocks)
  }

  // Toggle dla checkbox
  const toggleTodo = (blockId: string) => {
    const newBlocks = blocks.map(block => {
      if (block.id === blockId && block.type === 'to_do') {
        return {
          ...block,
          metadata: {
            ...block.metadata,
            checked: !block.metadata?.checked
          },
          last_edited_time: new Date().toISOString()
        }
      }
      return block
    })
    setBlocks(newBlocks)
    onChange?.(newBlocks)
  }

  // Drag & Drop handlers
  const handleDragStart = (e: DragEvent, blockId: string, index: number) => {
    setDraggedBlockId(blockId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', blockId)
  }

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: DragEvent, dropIndex: number) => {
    e.preventDefault()
    const draggedBlockIndex = blocks.findIndex(block => block.id === draggedBlockId)
    
    if (draggedBlockIndex !== -1 && draggedBlockIndex !== dropIndex) {
      moveBlock(draggedBlockIndex, dropIndex)
    }
    
    setDraggedBlockId(null)
    setDragOverIndex(null)
  }

  // Obsługa klawiatury
  const handleKeyDown = (e: KeyboardEvent, blockId: string, blockIndex: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addBlock(blockIndex + 1)
    } else if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId)
      const plainContent = block?.content.map(c => c.text.content).join('')
      if (block && plainContent === '') {
        e.preventDefault()
        deleteBlock(blockId)
        // Focus na poprzedni blok
        if (blockIndex > 0) {
          setFocusedBlockId(blocks[blockIndex - 1].id)
        }
      }
    } else if (e.key === '/' && blocks.find(b => b.id === blockId)?.content.map(c => c.text.content).join('') === '') {
      e.preventDefault()
      setShowBlockMenu(blockId)
    }
  }

  // Menu typów bloków
  const blockTypes = [
    { type: 'paragraph' as BlockType, icon: Type, label: 'Text', description: 'Just start writing with plain text.' },
    { type: 'heading_1' as BlockType, icon: Hash, label: 'Heading 1', description: 'Big section heading.' },
    { type: 'heading_2' as BlockType, icon: Hash, label: 'Heading 2', description: 'Medium section heading.' },
    { type: 'heading_3' as BlockType, icon: Hash, label: 'Heading 3', description: 'Small section heading.' },
    { type: 'bulleted_list_item' as BlockType, icon: List, label: 'Bulleted list', description: 'Create a simple bulleted list.' },
    { type: 'numbered_list_item' as BlockType, icon: List, label: 'Numbered list', description: 'Create a list with numbering.' },
    { type: 'to_do' as BlockType, icon: CheckSquare, label: 'To-do list', description: 'Track tasks with a to-do list.' },
    { type: 'toggle' as BlockType, icon: ToggleLeft, label: 'Toggle list', description: 'Toggles can hide and show content inside.' }
  ]

  return (
    <div className="max-w-2xl mx-auto py-8 px-6">
      {blocks.length === 0 && (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <Type className="h-12 w-12 mx-auto mb-3" />
            <p>Start writing or type '/' for commands...</p>
          </div>
          <Button onClick={() => addBlock(0)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Add a block
          </Button>
        </div>
      )}

      {blocks.map((block, index) => (
        <BlockComponent
          key={block.id}
          block={block}
          index={index}
          focused={focusedBlockId === block.id}
          showMenu={showBlockMenu === block.id}
          isDragged={draggedBlockId === block.id}
          isDraggedOver={dragOverIndex === index}
          onFocus={() => setFocusedBlockId(block.id)}
          onContentChange={(content) => updateBlockContent(block.id, content)}
          onKeyDown={(e) => handleKeyDown(e, block.id, index)}
          onTypeChange={(type) => changeBlockType(block.id, type)}
          onToggleTodo={() => toggleTodo(block.id)}
          onAddBlock={() => addBlock(index + 1)}
          onDelete={() => deleteBlock(block.id)}
          onDragStart={(e) => handleDragStart(e, block.id, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          blockTypes={blockTypes}
          onCloseMenu={() => setShowBlockMenu(null)}
        />
      ))}

      {/* Dodaj blok na końcu */}
      <div className="mt-4">
        <Button
          onClick={() => addBlock()}
          variant="ghost"
          className="w-full justify-start gap-2 h-8 text-gray-400 hover:text-gray-600"
        >
          <Plus className="h-4 w-4" />
          Add a block
        </Button>
      </div>
    </div>
  )
}

// Komponent pojedynczego bloku
interface BlockComponentProps {
  block: Block
  index: number
  focused: boolean
  showMenu: boolean
  isDragged: boolean
  isDraggedOver: boolean
  onFocus: () => void
  onContentChange: (content: string) => void
  onKeyDown: (e: KeyboardEvent) => void
  onTypeChange: (type: BlockType) => void
  onToggleTodo: () => void
  onAddBlock: () => void
  onDelete: () => void
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
  blockTypes: any[]
  onCloseMenu: () => void
}

function BlockComponent({
  block,
  index,
  focused,
  showMenu,
  isDragged,
  isDraggedOver,
  onFocus,
  onContentChange,
  onKeyDown,
  onTypeChange,
  onToggleTodo,
  onAddBlock,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  blockTypes,
  onCloseMenu
}: BlockComponentProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (focused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [focused])

  // Konwertuj sformatowaną treść z powrotem na plain text z markdown
  const getPlainTextWithMarkdown = (content: RichText[]): string => {
    return content.map(part => {
      let text = part.text.content
      if (part.annotations?.bold) text = `**${text}**`
      if (part.annotations?.italic) text = `*${text}*`
      if (part.annotations?.strikethrough) text = `~~${text}~~`
      if (part.annotations?.code) text = `\`${text}\``
      return text
    }).join('')
  }

  const getBlockStyles = (type: BlockType) => {
    switch (type) {
      case 'heading_1':
        return 'text-3xl font-bold text-gray-900'
      case 'heading_2':
        return 'text-2xl font-semibold text-gray-900'
      case 'heading_3':
        return 'text-xl font-medium text-gray-900'
      default:
        return 'text-base text-gray-900'
    }
  }

  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      case 'bulleted_list_item':
        return <span className="text-gray-400 mr-2">•</span>
      case 'numbered_list_item':
        return <span className="text-gray-400 mr-2">{index + 1}.</span>
      case 'to_do':
        return (
          <button 
            onClick={onToggleTodo}
            className="mr-2 mt-0.5"
          >
            <CheckSquare 
              className={`h-4 w-4 ${block.metadata?.checked ? 'text-blue-600' : 'text-gray-400'}`}
              fill={block.metadata?.checked ? 'currentColor' : 'none'}
            />
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div 
      className={`group relative flex items-start gap-1 py-1 transition-all duration-200 ${
        isDragged ? 'opacity-50' : ''
      } ${
        isDraggedOver ? 'border-t-2 border-blue-500' : ''
      }`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      {/* Drag handle */}
      <div className="opacity-0 group-hover:opacity-100 flex items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-gray-400 cursor-grab active:cursor-grabbing hover:bg-gray-100"
        >
          <GripVertical className="h-3 w-3" />
        </Button>
      </div>

      {/* Block content */}
      <div className="flex-1">
        <div className="flex items-start">
          {getBlockIcon(block.type)}
          <div className="flex-1">
            {block.type === 'paragraph' || block.type.includes('heading') ? (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={getPlainTextWithMarkdown(block.content)}
                onChange={(e) => onContentChange(e.target.value)}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                placeholder={
                  block.type === 'heading_1' ? 'Heading 1' :
                  block.type === 'heading_2' ? 'Heading 2' :
                  block.type === 'heading_3' ? 'Heading 3' :
                  'Type \'/\' for commands, **bold**, *italic*'
                }
                className={`w-full border-none outline-none bg-transparent resize-none ${getBlockStyles(block.type)} placeholder-gray-400`}
              />
            ) : (
              <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                type="text"
                value={getPlainTextWithMarkdown(block.content)}
                onChange={(e) => onContentChange(e.target.value)}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                placeholder="Type something... **bold**, *italic*"
                className={`w-full border-none outline-none bg-transparent resize-none ${getBlockStyles(block.type)} placeholder-gray-400 ${
                  block.metadata?.checked ? 'line-through text-gray-500' : ''
                }`}
              />
            )}
          </div>
        </div>
      </div>

      {/* Add block button */}
      <div className="opacity-0 group-hover:opacity-100">
        <Button 
          onClick={onAddBlock}
          variant="ghost" 
          size="sm" 
          className="h-6 w-6 p-0 text-gray-400"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Block type menu */}
      {showMenu && (
        <div className="absolute top-8 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10 w-80">
          <div className="space-y-1">
            {blockTypes.map(({ type, icon: Icon, label, description }) => (
              <button
                key={type}
                onClick={() => onTypeChange(type)}
                className="w-full flex items-start gap-3 p-2 hover:bg-gray-50 rounded text-left"
              >
                <Icon className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <div className="font-medium text-sm text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">{description}</div>
                </div>
              </button>
            ))}
          </div>
          
          {/* Markdown help */}
          <div className="border-t border-gray-100 mt-2 pt-2">
            <div className="text-xs text-gray-500 space-y-1">
              <div><strong>Markdown shortcuts:</strong></div>
              <div>**bold** *italic* ~~strikethrough~~ `code`</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 