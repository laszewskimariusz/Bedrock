"use client"

import { useState, useEffect, useRef, KeyboardEvent, DragEvent } from 'react'
import { 
  MdAdd, 
  MdDragIndicator, 
  MdMoreHoriz, 
  MdTitle, 
  MdFormatListBulleted, 
  MdCheckBox,
  MdKeyboardArrowDown,
  MdDelete,
  MdLink,
  MdArrowRight,
  MdCode
} from 'react-icons/md'
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
  | 'code'

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
  const [selectedBlockIds, setSelectedBlockIds] = useState<Set<string>>(new Set())
  const [lastSelectedBlockId, setLastSelectedBlockId] = useState<string | null>(null) // anchor dla Shift+click
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null)
  const [isDragSelecting, setIsDragSelecting] = useState(false)
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    blockId?: string;
    selectedBlocks?: string[];
    x: number;
    y: number;
    submenu?: 'turnInto' | 'color' | null;
  } | null>(null)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  // Synchronizuj bloki gdy initialBlocks się zmieni
  useEffect(() => {
    setBlocks(initialBlocks)
  }, [initialBlocks])

  // Automatycznie ustaw fokus na pierwszym bloku
  useEffect(() => {
    if (blocks.length > 0 && !focusedBlockId) {
      // Małe opóźnienie żeby komponenty zdążyły się załadować
      setTimeout(() => {
        setFocusedBlockId(blocks[0].id)
      }, 100)
    }
  }, [blocks, focusedBlockId])

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

  // Funkcja do rozpoznawania typu bloku na podstawie formatowania markdown
  const detectBlockType = (line: string): { type: BlockType; content: string; metadata?: any } => {
    const trimmed = line.trim()
    
    // Nagłówki
    if (trimmed.startsWith('# ')) {
      return { type: 'heading_1', content: trimmed.substring(2) }
    }
    if (trimmed.startsWith('## ')) {
      return { type: 'heading_2', content: trimmed.substring(3) }
    }
    if (trimmed.startsWith('### ')) {
      return { type: 'heading_3', content: trimmed.substring(4) }
    }
    
    // Lista punktowana
    if (trimmed.match(/^[-*+]\s+/)) {
      return { type: 'bulleted_list_item', content: trimmed.replace(/^[-*+]\s+/, '') }
    }
    
    // Lista numerowana
    if (trimmed.match(/^\d+\.\s+/)) {
      return { type: 'numbered_list_item', content: trimmed.replace(/^\d+\.\s+/, '') }
    }
    
    // Checkbox (todo list)
    if (trimmed.match(/^[-*+]\s+\[\s\]\s+/)) {
      return { 
        type: 'to_do', 
        content: trimmed.replace(/^[-*+]\s+\[\s\]\s+/, ''),
        metadata: { checked: false }
      }
    }
    if (trimmed.match(/^[-*+]\s+\[x\]\s+/i)) {
      return { 
        type: 'to_do', 
        content: trimmed.replace(/^[-*+]\s+\[x\]\s+/i, ''),
        metadata: { checked: true }
      }
    }
    
    // Blok kodu (zaczyna się od ```)
    if (trimmed.startsWith('```')) {
      return { type: 'code', content: trimmed.replace(/^```\w*\s*/, '') }
    }
    
    // Cytaty
    if (trimmed.startsWith('> ')) {
      return { type: 'paragraph', content: trimmed.substring(2) }
    }
    
    // Domyślnie paragraph
    return { type: 'paragraph', content: trimmed }
  }

  // Obsługa wklejania tekstu z wieloma liniami i inteligentnym rozpoznawaniem formatowania
  const handlePaste = (e: React.ClipboardEvent, blockId: string, blockIndex: number) => {
    const pastedText = e.clipboardData.getData('text')
    
    // Sprawdź czy tekst zawiera znaki nowej linii (również \r\n dla Windows)
    if (pastedText.includes('\n') || pastedText.includes('\r\n')) {
      e.preventDefault()
      
      const lines = pastedText.split(/\r?\n/).filter(line => line.trim() !== '')
      
      if (lines.length > 1) {
        // Pierwszą linię analizuj i wstaw do aktualnego bloku
        const firstLine = detectBlockType(lines[0])
        changeBlockType(blockId, firstLine.type)
        updateBlockContent(blockId, firstLine.content)
        
        // Jeśli pierwsza linia ma metadata (np. checked dla todo), zaktualizuj
        if (firstLine.metadata) {
          const newBlocks = blocks.map(block => {
            if (block.id === blockId) {
              return { ...block, metadata: { ...block.metadata, ...firstLine.metadata } }
            }
            return block
          })
          setBlocks(newBlocks)
        }
        
        // Dla każdej kolejnej linii stwórz nowy blok z odpowiednim typem
        const newBlocks = [...blocks]
        for (let i = 1; i < lines.length; i++) {
          const lineInfo = detectBlockType(lines[i])
          const newBlock = createBlock(lineInfo.type, lineInfo.content)
          
          // Dodaj metadata jeśli istnieje
          if (lineInfo.metadata) {
            newBlock.metadata = { ...newBlock.metadata, ...lineInfo.metadata }
          }
          
          newBlocks.splice(blockIndex + i, 0, newBlock)
        }
        
        setBlocks(newBlocks)
        onChange?.(newBlocks)
        
        // Ustaw fokus na ostatnim utworzonym bloku
        if (lines.length > 1) {
          setTimeout(() => {
            const lastBlockId = newBlocks[blockIndex + lines.length - 1].id
            setFocusedBlockId(lastBlockId)
          }, 100)
        }
      }
    }
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
    // Nie pozwalaj usunąć ostatniego bloku
    if (blocks.length <= 1) {
      return
    }
    
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
        
        // Jeśli to jedyny blok, tylko wyczyść zawartość
        if (blocks.length === 1) {
          // Blok jest już pusty, nic nie rób
          return
        }
        
        // W przeciwnym razie usuń blok i przenieś fokus
        deleteBlock(blockId)
        if (blockIndex > 0) {
          setFocusedBlockId(blocks[blockIndex - 1].id)
        }
      }
    } else if (e.key === '/' && blocks.find(b => b.id === blockId)?.content.map(c => c.text.content).join('') === '') {
      e.preventDefault()
      setShowBlockMenu(blockId)
    }
  }

  // Kliknięcie w treść bloku (input/textarea) - nie zaznacza bloku, tylko aktywuje edycję
  const handleBlockClick = (blockId: string, e: React.MouseEvent) => {
    // Nie rób nic jeśli użytkownik zaznacza tekst
    if (window.getSelection()?.toString()) {
      return
    }
    // Kliknięcie w treść - tylko wyczyść zaznaczenie jeśli istnieje
    if (selectedBlockIds.size > 0) {
      setSelectedBlockIds(new Set())
      setLastSelectedBlockId(null)
    }
  }

  // Kliknięcie na margines bloku - zaznacza blok (jak w Notion)
  const handleMarginClick = (blockId: string, e: React.MouseEvent) => {
    e.preventDefault()
    
    if (e.shiftKey) {
      // Shift+click: Range selection
      let anchorId = lastSelectedBlockId
      
      // Jeśli nie ma lastSelectedBlockId, użyj pierwszego zaznaczonego lub focusedBlockId
      if (!anchorId) {
        if (selectedBlockIds.size > 0) {
          anchorId = Array.from(selectedBlockIds)[0]
        } else {
          anchorId = focusedBlockId
        }
      }
      
      if (anchorId) {
        const anchorIndex = blocks.findIndex(b => b.id === anchorId)
        const clickedIndex = blocks.findIndex(b => b.id === blockId)
        
        if (anchorIndex !== -1 && clickedIndex !== -1) {
          const startIndex = Math.min(anchorIndex, clickedIndex)
          const endIndex = Math.max(anchorIndex, clickedIndex)
          
          const rangeIds = new Set<string>()
          for (let i = startIndex; i <= endIndex; i++) {
            rangeIds.add(blocks[i].id)
          }
          setSelectedBlockIds(rangeIds)
          // Nie zmieniaj lastSelectedBlockId podczas range selection
        }
      } else {
        // Fallback: zaznacz tylko kliknięty blok
        setSelectedBlockIds(new Set([blockId]))
        setLastSelectedBlockId(blockId)
      }
    } else if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd+click: Toggle pojedynczy blok w zaznaczeniu
      const newSelected = new Set(selectedBlockIds)
      if (newSelected.has(blockId)) {
        newSelected.delete(blockId)
        // Jeśli usuwamy lastSelectedBlockId, ustaw nowy
        if (lastSelectedBlockId === blockId && newSelected.size > 0) {
          setLastSelectedBlockId(Array.from(newSelected)[0])
        } else if (newSelected.size === 0) {
          setLastSelectedBlockId(null)
        }
      } else {
        newSelected.add(blockId)
        setLastSelectedBlockId(blockId)
      }
      setSelectedBlockIds(newSelected)
    } else {
      // Zwykły klik na margin: Zaznacz tylko ten blok
      setSelectedBlockIds(new Set([blockId]))
      setLastSelectedBlockId(blockId)
      setFocusedBlockId(null) // Wyczyść focus z edycji
    }
  }

  const handleContextMenu = (e: React.MouseEvent, blockId: string) => {
    e.preventDefault()
    
    if (selectedBlockIds.size > 0 && selectedBlockIds.has(blockId)) {
      // Context menu for multiple selected blocks
      setContextMenu({
        selectedBlocks: Array.from(selectedBlockIds),
        x: e.clientX,
        y: e.clientY,
        submenu: null
      })
    } else {
      // Context menu for single block
      setContextMenu({
        blockId,
        x: e.clientX,
        y: e.clientY,
        submenu: null
      })
    }
  }

  const deleteSelectedBlocks = () => {
    if (selectedBlockIds.size > 0) {
      const newBlocks = blocks.filter(block => !selectedBlockIds.has(block.id))
      setBlocks(newBlocks)
      setSelectedBlockIds(new Set())
      onChange?.(newBlocks)
    }
  }

  const closeContextMenu = () => {
    setContextMenu(null)
  }

  const copyBlockLink = (blockId: string) => {
    const url = `${window.location.origin}/page/${pageId}#${blockId}`
    navigator.clipboard.writeText(url)
    closeContextMenu()
  }

  // Click outside to close context menu & keyboard shortcuts
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenu) {
        closeContextMenu()
      }
    }
    
    const handleKeyDown = (e: Event) => {
      const keyEvent = e as globalThis.KeyboardEvent
      
      // Delete key - usuń zaznaczone bloki
      if (keyEvent.key === 'Delete' && selectedBlockIds.size > 0) {
        keyEvent.preventDefault()
        deleteSelectedBlocks()
      }
      
      // Escape - wyczyść zaznaczenie
      if (keyEvent.key === 'Escape') {
        setSelectedBlockIds(new Set())
        setLastSelectedBlockId(null)
        closeContextMenu()
      }

      // Ctrl+A - zaznacz wszystkie bloki (tylko gdy nie ma focus w input/textarea)
      if (keyEvent.key === 'a' && (keyEvent.ctrlKey || keyEvent.metaKey)) {
        const activeElement = document.activeElement
        if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
          keyEvent.preventDefault()
          const allBlockIds = new Set(blocks.map(block => block.id))
          setSelectedBlockIds(allBlockIds)
          if (blocks.length > 0) {
            setLastSelectedBlockId(blocks[blocks.length - 1].id)
          }
        }
      }
      
      // Strzałki + Shift do range selection (gdy nie ma focus w input)
      if ((keyEvent.key === 'ArrowUp' || keyEvent.key === 'ArrowDown') && keyEvent.shiftKey) {
        const activeElement = document.activeElement
        if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
          keyEvent.preventDefault()
          
          const currentBlock = lastSelectedBlockId || focusedBlockId
          if (currentBlock) {
            const currentIndex = blocks.findIndex(b => b.id === currentBlock)
            if (currentIndex !== -1) {
              const nextIndex = keyEvent.key === 'ArrowUp' ? currentIndex - 1 : currentIndex + 1
              if (nextIndex >= 0 && nextIndex < blocks.length) {
                const targetBlockId = blocks[nextIndex].id
                
                // Range selection od lastSelectedBlockId do targetBlockId
                const anchorId = lastSelectedBlockId || currentBlock
                const anchorIndex = blocks.findIndex(b => b.id === anchorId)
                const startIndex = Math.min(anchorIndex, nextIndex)
                const endIndex = Math.max(anchorIndex, nextIndex)
                
                const rangeIds = new Set<string>()
                for (let i = startIndex; i <= endIndex; i++) {
                  rangeIds.add(blocks[i].id)
                }
                setSelectedBlockIds(rangeIds)
              }
            }
          }
        }
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('click', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [contextMenu, selectedBlockIds])

  // Menu typów bloków
  const blockTypes = [
    { type: 'paragraph' as BlockType, icon: MdTitle, label: 'Text', description: 'Just start writing with plain text.' },
    { type: 'heading_1' as BlockType, icon: MdTitle, label: 'Heading 1', description: 'Big section heading.' },
    { type: 'heading_2' as BlockType, icon: MdTitle, label: 'Heading 2', description: 'Medium section heading.' },
    { type: 'heading_3' as BlockType, icon: MdTitle, label: 'Heading 3', description: 'Small section heading.' },
    { type: 'bulleted_list_item' as BlockType, icon: MdFormatListBulleted, label: 'Bulleted list', description: 'Create a simple bulleted list.' },
    { type: 'numbered_list_item' as BlockType, icon: MdFormatListBulleted, label: 'Numbered list', description: 'Create a list with numbering.' },
    { type: 'to_do' as BlockType, icon: MdCheckBox, label: 'To-do list', description: 'Track tasks with a to-do list.' },
    { type: 'toggle' as BlockType, icon: MdKeyboardArrowDown, label: 'Toggle list', description: 'Toggles can hide and show content inside.' },
    { type: 'code' as BlockType, icon: MdCode, label: 'Code', description: 'Capture a code snippet.' }
  ]

  const colorOptions = [
    { value: 'default', label: 'Default text', className: 'text-gray-900' },
    { value: 'gray', label: 'Gray text', className: 'text-gray-500' },
    { value: 'brown', label: 'Brown text', className: 'text-amber-700' },
    { value: 'orange', label: 'Orange text', className: 'text-orange-500' },
    { value: 'yellow', label: 'Yellow text', className: 'text-yellow-500' },
    { value: 'green', label: 'Green text', className: 'text-green-500' },
    { value: 'blue', label: 'Blue text', className: 'text-blue-500' },
    { value: 'purple', label: 'Purple text', className: 'text-purple-500' },
    { value: 'pink', label: 'Pink text', className: 'text-pink-500' },
    { value: 'red', label: 'Red text', className: 'text-red-500' },
  ]

  const backgroundColorOptions = [
    { value: 'default', label: 'Default background', className: 'bg-transparent' },
    { value: 'gray', label: 'Gray background', className: 'bg-gray-100' },
    { value: 'brown', label: 'Brown background', className: 'bg-amber-100' },
    { value: 'orange', label: 'Orange background', className: 'bg-orange-100' },
    { value: 'yellow', label: 'Yellow background', className: 'bg-yellow-100' },
    { value: 'green', label: 'Green background', className: 'bg-green-100' },
    { value: 'blue', label: 'Blue background', className: 'bg-blue-100' },
    { value: 'purple', label: 'Purple background', className: 'bg-purple-100' },
    { value: 'pink', label: 'Pink background', className: 'bg-pink-100' },
    { value: 'red', label: 'Red background', className: 'bg-red-100' },
  ]

  // Drag Selection handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
      // Check if click is on empty area (not on a block element)
      const target = e.target as HTMLElement
      if (target.closest('.block-content') || target.closest('button') || target.closest('input') || target.closest('textarea')) {
        return
      }
      
      setIsDragSelecting(true)
      setDragStartPos({ x: e.clientX, y: e.clientY })
      setSelectedBlockIds(new Set()) // Clear selection
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragSelecting && dragStartPos) {
      // Calculate selection area and select blocks within it
      const containerRect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const startY = dragStartPos.y - containerRect.top
      const currentY = e.clientY - containerRect.top
      
      const minY = Math.min(startY, currentY)
      const maxY = Math.max(startY, currentY)
      
      // Find blocks that intersect with the selection area
      const newSelected = new Set<string>()
      blocks.forEach((block, index) => {
        const blockElement = document.querySelector(`[data-block-id="${block.id}"]`) as HTMLElement
        if (blockElement) {
          const blockRect = blockElement.getBoundingClientRect()
          const blockTopRelative = blockRect.top - containerRect.top
          const blockBottomRelative = blockRect.bottom - containerRect.top
          
          if (blockBottomRelative >= minY && blockTopRelative <= maxY) {
            newSelected.add(block.id)
          }
        }
      })
      
      setSelectedBlockIds(newSelected)
    }
  }

  const handleMouseUp = () => {
    if (isDragSelecting) {
      setIsDragSelecting(false)
      setDragStartPos(null)
    }
  }

  return (
    <div 
      className="max-w-2xl mx-auto py-8 px-6 select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ position: 'relative' }}
    >
      {/* Drag selection overlay */}
      {isDragSelecting && dragStartPos && (
        <div 
          className="fixed pointer-events-none border-2 border-blue-500 bg-blue-500/10 z-50"
          style={{
            left: Math.min(dragStartPos.x, 0),
            top: Math.min(dragStartPos.y, 0),
            width: Math.abs(0 - dragStartPos.x),
            height: Math.abs(0 - dragStartPos.y)
          }}
        />
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
          isSelected={selectedBlockIds.has(block.id)}
          onFocus={() => setFocusedBlockId(block.id)}
          onContentChange={(content) => updateBlockContent(block.id, content)}
          onKeyDown={(e) => handleKeyDown(e, block.id, index)}
          onPaste={(e) => handlePaste(e, block.id, index)}
          onTypeChange={(type) => changeBlockType(block.id, type)}
          onToggleTodo={() => toggleTodo(block.id)}
          onAddBlock={() => addBlock(index + 1)}
          onDelete={() => deleteBlock(block.id)}
          onDragStart={(e) => handleDragStart(e, block.id, index)}
          onDragOver={(e) => handleDragOver(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
          onContextMenu={(e) => handleContextMenu(e, block.id)}
          onBlockClick={(e) => handleBlockClick(block.id, e)}
          onMarginClick={(e) => handleMarginClick(block.id, e)}
          blockTypes={blockTypes}
          onCloseMenu={() => setShowBlockMenu(null)}
        />
      ))}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl py-2 z-50 min-w-[240px]"
          style={{ 
            left: contextMenu.x, 
            top: contextMenu.y,
            maxHeight: '400px',
            overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.submenu === 'turnInto' ? (
            <div className="relative">
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors border-b border-gray-100"
                onClick={() => setContextMenu({ ...contextMenu, submenu: undefined })}
              >
                <span>← Turn into</span>
              </button>
              {blockTypes.map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors"
                  onClick={() => {
                    if (contextMenu.blockId) {
                      changeBlockType(contextMenu.blockId, type)
                    }
                    closeContextMenu()
                  }}
                >
                  <Icon className="h-4 w-4 text-gray-400" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ) : contextMenu.submenu === 'color' ? (
            <div className="relative">
              <button
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors border-b border-gray-100"
                onClick={() => setContextMenu({ ...contextMenu, submenu: undefined })}
              >
                <span>← Color</span>
              </button>
              <div className="px-4 py-2 text-xs text-gray-500 font-medium">
                Text color
              </div>
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors"
                  onClick={() => {
                    // TODO: Implement color change
                    closeContextMenu()
                  }}
                >
                  <span className={`text-sm font-medium ${color.className}`}>A</span>
                  <span>{color.label}</span>
                </button>
              ))}
              <div className="border-t border-gray-100 mt-1 pt-1">
                <div className="px-4 py-2 text-xs text-gray-500 font-medium">
                  Background color
                </div>
                {backgroundColorOptions.map((color) => (
                  <button
                    key={color.value}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors"
                    onClick={() => {
                      // TODO: Implement background color change
                      closeContextMenu()
                    }}
                  >
                    <span className={`w-4 h-4 rounded border border-gray-300 ${color.className}`}></span>
                    <span>{color.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {contextMenu.selectedBlocks ? (
                // Multi-select menu
                <div>
                  <div className="px-4 py-2.5 text-xs text-gray-500 border-b border-gray-100 font-medium">
                    {contextMenu.selectedBlocks.length} block{contextMenu.selectedBlocks.length === 1 ? '' : 's'} selected
                  </div>
                  
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors"
                    onClick={() => {
                      // TODO: Duplicate selected blocks
                      closeContextMenu()
                    }}
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-base">📋</span>
                    <span>Duplicate</span>
                    <span className="ml-auto text-xs text-gray-400">Ctrl+D</span>
                  </button>
                  
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors"
                    onClick={() => {
                      // TODO: Move selected blocks
                      closeContextMenu()
                    }}
                  >
                    <span className="w-4 h-4 flex items-center justify-center text-base">📁</span>
                    <span>Move to</span>
                    <span className="ml-auto text-xs text-gray-400">Ctrl+⇧+P</span>
                  </button>
                  
                  <hr className="border-gray-100 my-1" />
                  
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-red-600 transition-colors"
                    onClick={() => {
                      deleteSelectedBlocks()
                      closeContextMenu()
                    }}
                  >
                    <MdDelete className="h-4 w-4" />
                    <span>Delete {contextMenu.selectedBlocks.length} block{contextMenu.selectedBlocks.length === 1 ? '' : 's'}</span>
                    <span className="ml-auto text-xs text-gray-400">Del</span>
                  </button>
                </div>
              ) : (
                // Single block menu
                <div>
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors"
                    onClick={() => setContextMenu({ ...contextMenu, submenu: 'turnInto' })}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-4 h-4 flex items-center justify-center text-base">🔄</span>
                      <span>Turn into</span>
                    </span>
                    <MdArrowRight className="h-3 w-3 text-gray-400" />
                  </button>
                  
                  <button
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors"
                    onClick={() => setContextMenu({ ...contextMenu, submenu: 'color' })}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-4 h-4 flex items-center justify-center text-base">🎨</span>
                      <span>Color</span>
                    </span>
                    <MdArrowRight className="h-3 w-3 text-gray-400" />
                  </button>
                  
                  {contextMenu.blockId && (
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-gray-700 transition-colors"
                      onClick={() => copyBlockLink(contextMenu.blockId!)}
                    >
                      <MdLink className="h-4 w-4 text-gray-400" />
                      <span>Copy link to block</span>
                      <span className="ml-auto text-xs text-gray-400">Alt+⌘+L</span>
                    </button>
                  )}
                  
                  <hr className="border-gray-100 my-1" />
                  
                  <button
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 text-left text-red-600 transition-colors"
                    onClick={() => {
                      if (contextMenu.blockId) {
                        deleteBlock(contextMenu.blockId)
                      }
                      closeContextMenu()
                    }}
                  >
                    <MdDelete className="h-4 w-4" />
                    <span>Delete</span>
                    <span className="ml-auto text-xs text-gray-400">Del</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Dodaj blok na końcu - w stylu Notion */}
      <div className="group relative flex items-start gap-1 py-1 hover:bg-gray-50 dark:hover:bg-gray-800 rounded transition-colors">
        <div className="flex items-center gap-1">
          <Button 
            onClick={() => addBlock()}
            variant="ghost" 
            size="sm" 
            className="h-6 w-6 p-0 text-gray-800 dark:text-gray-100 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
            title="Add block"
          >
            <MdAdd className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
        <div className="flex-1 text-gray-500 dark:text-gray-400 text-sm py-1 px-2 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300 transition-colors" onClick={() => addBlock()}>
          Click to add a block, or press Enter in block above
        </div>
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
  isSelected: boolean
  onFocus: () => void
  onContentChange: (content: string) => void
  onKeyDown: (e: KeyboardEvent) => void
  onPaste: (e: React.ClipboardEvent) => void
  onTypeChange: (type: BlockType) => void
  onToggleTodo: () => void
  onAddBlock: () => void
  onDelete: () => void
  onDragStart: (e: DragEvent) => void
  onDragOver: (e: DragEvent) => void
  onDragLeave: () => void
  onDrop: (e: DragEvent) => void
  onContextMenu: (e: React.MouseEvent) => void
  onBlockClick: (e: React.MouseEvent) => void
  onMarginClick: (e: React.MouseEvent) => void
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
  isSelected,
  onFocus,
  onContentChange,
  onKeyDown,
  onPaste,
  onTypeChange,
  onToggleTodo,
  onAddBlock,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onContextMenu,
  onBlockClick,
  onMarginClick,
  blockTypes,
  onCloseMenu
}: BlockComponentProps) {
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (focused && inputRef.current) {
      inputRef.current.focus()
    }
  }, [focused])

  // Renderuj sformatowaną treść z właściwym HTML
  const renderRichText = (content: RichText[]) => {
    return content.map((part, index) => {
      let className = ''
      if (part.annotations?.bold) className += ' font-bold'
      if (part.annotations?.italic) className += ' italic'
      if (part.annotations?.strikethrough) className += ' line-through'
      if (part.annotations?.code) {
        return (
          <code 
            key={index} 
            className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono border"
          >
            {part.text.content}
          </code>
        )
      }
      
      return (
        <span key={index} className={className}>
          {part.text.content}
        </span>
      )
    })
  }

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
        return 'text-3xl font-bold text-gray-900 py-1'
      case 'heading_2':
        return 'text-2xl font-semibold text-gray-900 py-1'
      case 'heading_3':
        return 'text-xl font-medium text-gray-900 py-0.5'
      case 'code':
        return 'text-sm font-mono text-gray-800 bg-gray-100 px-3 py-2 rounded border'
      case 'to_do':
        return `text-base text-gray-900 ${block.metadata?.checked ? 'line-through text-gray-500' : ''}`
      default:
        return 'text-base text-gray-900'
    }
  }

  const getBlockIcon = (type: BlockType) => {
    switch (type) {
      case 'bulleted_list_item':
        return <span className="text-gray-400 mr-3 select-none">•</span>
      case 'numbered_list_item':
        return <span className="text-gray-500 mr-3 min-w-[1.5rem] text-sm select-none">{index + 1}.</span>
      case 'to_do':
        return (
          <button 
            onClick={onToggleTodo}
            className="mr-3 mt-0.5 hover:bg-gray-100 rounded p-0.5 transition-colors"
          >
            {block.metadata?.checked ? (
              <div className="w-4 h-4 bg-blue-600 border border-blue-600 rounded flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            ) : (
              <div className="w-4 h-4 border-2 border-gray-300 rounded hover:border-gray-400 transition-colors"></div>
            )}
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div 
      data-block-id={block.id}
      className={`group relative flex items-start gap-1 py-1 transition-all duration-200 ${
        isDragged ? 'opacity-50' : ''
      } ${
        isDraggedOver ? 'border-t-2 border-blue-500' : ''
      } ${
        isSelected ? 'bg-blue-50 border border-blue-200 rounded-sm' : ''
      }`}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onContextMenu={onContextMenu}
    >
      {/* Margin area - clickable for block selection */}
      <div 
        className="absolute left-0 top-0 w-8 h-full z-10 cursor-pointer" 
        onClick={onMarginClick}
        title="Click to select block"
      />
      {/* Block controls - left side */}
      <div className={`flex items-center gap-1 transition-opacity duration-200 ${
        focused || isDragged ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
      }`}>
        {/* Add block button */}
        <button 
          onClick={onAddBlock}
          className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors rounded flex items-center justify-center"
          title="Add block below"
        >
          <MdAdd className="h-4 w-4 text-gray-600" />
        </button>
        
        {/* Drag handle */}
        <button 
          draggable
          onDragStart={onDragStart}
          onClick={(e) => e.preventDefault()}
          onContextMenu={onContextMenu}
          className="h-6 w-6 p-0 cursor-grab active:cursor-grabbing hover:bg-gray-100 transition-colors rounded flex items-center justify-center"
          title="Drag to move"
        >
          <MdDragIndicator className="h-4 w-4 text-gray-600" />
        </button>
      </div>

      {/* Block content */}
      <div className="flex-1 block-content" onClick={onBlockClick}>
        <div className="flex items-start">
          {getBlockIcon(block.type)}
          <div className="flex-1">
            {block.type === 'code' ? (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={getPlainTextWithMarkdown(block.content)}
                onChange={(e) => onContentChange(e.target.value)}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                onClick={(e) => e.stopPropagation()}
                placeholder="Type your code here..."
                className={`w-full border-none outline-none resize-none min-h-[2.5rem] ${getBlockStyles(block.type)} placeholder-gray-400`}
                rows={1}
                style={{ 
                  height: 'auto',
                  minHeight: '2.5rem'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            ) : (
              <textarea
                ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                value={getPlainTextWithMarkdown(block.content)}
                onChange={(e) => onContentChange(e.target.value)}
                onFocus={onFocus}
                onKeyDown={onKeyDown}
                onPaste={onPaste}
                onClick={(e) => e.stopPropagation()}
                placeholder={
                  block.type === 'heading_1' ? 'Heading 1' :
                  block.type === 'heading_2' ? 'Heading 2' :
                  block.type === 'heading_3' ? 'Heading 3' :
                  block.type === 'to_do' ? 'To-do' :
                  'Type here... Press \'/\' for commands, Enter for new block'
                }
                className={`w-full border-none outline-none bg-transparent resize-none overflow-hidden ${getBlockStyles(block.type)} placeholder-gray-400 ${
                  block.metadata?.checked ? 'line-through text-gray-500' : ''
                }`}
                rows={1}
                style={{ 
                  height: 'auto',
                  minHeight: block.type.includes('heading') ? '2rem' : '1.5rem',
                  lineHeight: block.type.includes('heading') ? '1.2' : '1.5'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
              />
            )}
          </div>
        </div>
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