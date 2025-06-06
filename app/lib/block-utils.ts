import { Block, BlockType, RichText } from '../../components/block-editor'

// Konwersja markdown na bloki
export function markdownToBlocks(markdown: string): Block[] {
  const lines = markdown.split('\n')
  const blocks: Block[] = []
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    if (line === '') {
      continue // Pomijaj puste linie
    }
    
    let block: Block
    
    // Nagłówki
    if (line.startsWith('# ')) {
      block = createBlock('heading_1', line.substring(2))
    } else if (line.startsWith('## ')) {
      block = createBlock('heading_2', line.substring(3))
    } else if (line.startsWith('### ')) {
      block = createBlock('heading_3', line.substring(4))
    }
    // Lista punktowana
    else if (line.startsWith('- ') || line.startsWith('* ')) {
      block = createBlock('bulleted_list_item', line.substring(2))
    }
    // Lista numerowana
    else if (/^\d+\.\s/.test(line)) {
      block = createBlock('numbered_list_item', line.replace(/^\d+\.\s/, ''))
    }
    // Lista zadań
    else if (line.startsWith('- [ ] ') || line.startsWith('* [ ] ')) {
      block = createBlock('to_do', line.substring(6))
      block.metadata = { checked: false }
    } else if (line.startsWith('- [x] ') || line.startsWith('* [x] ')) {
      block = createBlock('to_do', line.substring(6))
      block.metadata = { checked: true }
    }
    // Zwykły paragraf
    else {
      block = createBlock('paragraph', line)
    }
    
    blocks.push(block)
  }
  
  return blocks
}

// Konwersja bloków na markdown
export function blocksToMarkdown(blocks: Block[]): string {
  return blocks.map(block => blockToMarkdown(block)).join('\n\n')
}

function blockToMarkdown(block: Block): string {
  const content = getPlainTextFromRichText(block.content)
  
  switch (block.type) {
    case 'heading_1':
      return `# ${content}`
    case 'heading_2':
      return `## ${content}`
    case 'heading_3':
      return `### ${content}`
    case 'bulleted_list_item':
      return `- ${content}`
    case 'numbered_list_item':
      return `1. ${content}`
    case 'to_do':
      const checked = block.metadata?.checked ? 'x' : ' '
      return `- [${checked}] ${content}`
    default:
      return content
  }
}

// Funkcja do konwersji RichText na plain text z markdown formatting
export function getPlainTextFromRichText(content: RichText[]): string {
  return content.map(part => {
    let text = part.text.content
    if (part.annotations?.bold) text = `**${text}**`
    if (part.annotations?.italic) text = `*${text}*`
    if (part.annotations?.strikethrough) text = `~~${text}~~`
    if (part.annotations?.code) text = `\`${text}\``
    return text
  }).join('')
}

// Funkcja do parsowania markdown w treści
export function parseMarkdownInText(text: string): RichText[] {
  const parts: RichText[] = []
  
  // Regex patterns dla formatowania
  const patterns = [
    { regex: /\*\*(.*?)\*\*/g, annotation: 'bold' },
    { regex: /(?<!\*)\*([^*]+)\*(?!\*)/g, annotation: 'italic' },
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
  
  // Sortuj wszystkie matches po pozycji
  const allMatches: Array<{match: RegExpExecArray, type: string}> = []
  
  patterns.forEach(pattern => {
    pattern.regex.lastIndex = 0
    let match
    while ((match = pattern.regex.exec(text)) !== null) {
      allMatches.push({ match, type: pattern.annotation })
    }
  })
  
  allMatches.sort((a, b) => a.match.index - b.match.index)
  
  let lastIndex = 0
  
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

// Konwersja bloków na format Notion API
export function blocksToNotionFormat(blocks: Block[]): any[] {
  return blocks.map(block => ({
    object: 'block',
    id: block.id,
    type: block.type,
    [block.type]: {
      rich_text: block.content.map(content => ({
        type: content.type,
        text: {
          content: content.text.content,
          link: content.text.link
        },
        annotations: content.annotations || {
          bold: false,
          italic: false,
          strikethrough: false,
          underline: false,
          code: false,
          color: 'default'
        }
      })),
      ...(block.type === 'to_do' && { checked: block.metadata?.checked || false })
    },
    children: block.children ? blocksToNotionFormat(block.children) : [],
    created_time: block.created_time,
    last_edited_time: block.last_edited_time
  }))
}

// Konwersja z formatu Notion API na nasze bloki
export function notionFormatToBlocks(notionBlocks: any[]): Block[] {
  return notionBlocks.map(notionBlock => ({
    id: notionBlock.id,
    type: notionBlock.type as BlockType,
    content: notionBlock[notionBlock.type]?.rich_text?.map((rt: any) => ({
      type: rt.type,
      text: {
        content: rt.text.content,
        link: rt.text.link
      },
      annotations: rt.annotations
    })) || [],
    children: notionBlock.children ? notionFormatToBlocks(notionBlock.children) : [],
    metadata: notionBlock.type === 'to_do' ? 
      { checked: notionBlock[notionBlock.type]?.checked || false } : {},
    created_time: notionBlock.created_time,
    last_edited_time: notionBlock.last_edited_time
  }))
}

// Funkcja pomocnicza do tworzenia bloku
export function createBlock(type: BlockType, content: string = ''): Block {
  return {
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    content: parseMarkdownInText(content),
    children: [],
    metadata: type === 'to_do' ? { checked: false } : {},
    created_time: new Date().toISOString(),
    last_edited_time: new Date().toISOString()
  }
}

// Drag & Drop utilities
export function moveBlockInArray(blocks: Block[], fromIndex: number, toIndex: number): Block[] {
  const newBlocks = [...blocks]
  const [movedBlock] = newBlocks.splice(fromIndex, 1)
  newBlocks.splice(toIndex, 0, movedBlock)
  return newBlocks
}

export function findBlockById(blocks: Block[], blockId: string): Block | null {
  for (const block of blocks) {
    if (block.id === blockId) {
      return block
    }
    if (block.children && block.children.length > 0) {
      const found = findBlockById(block.children, blockId)
      if (found) return found
    }
  }
  return null
}

export function updateBlockInArray(blocks: Block[], blockId: string, updates: Partial<Block>): Block[] {
  return blocks.map(block => {
    if (block.id === blockId) {
      return { ...block, ...updates, last_edited_time: new Date().toISOString() }
    }
    if (block.children && block.children.length > 0) {
      return {
        ...block,
        children: updateBlockInArray(block.children, blockId, updates)
      }
    }
    return block
  })
}

// Funkcja do wyszukiwania bloków po treści
export function searchBlocks(blocks: Block[], query: string): Block[] {
  const lowerQuery = query.toLowerCase()
  const results: Block[] = []
  
  blocks.forEach(block => {
    const content = getPlainTextFromRichText(block.content).toLowerCase()
    if (content.includes(lowerQuery)) {
      results.push(block)
    }
    
    // Przeszukaj children
    if (block.children && block.children.length > 0) {
      results.push(...searchBlocks(block.children, query))
    }
  })
  
  return results
}

// Funkcja do liczenia słów w blokach
export function countWords(blocks: Block[]): number {
  return blocks.reduce((count, block) => {
    const content = getPlainTextFromRichText(block.content)
    const words = content.trim().split(/\s+/).filter(word => word.length > 0)
    const childWords = block.children ? countWords(block.children) : 0
    return count + words.length + childWords
  }, 0)
}

// Funkcja do liczenia znaków w blokach
export function countCharacters(blocks: Block[]): number {
  return blocks.reduce((count, block) => {
    const content = getPlainTextFromRichText(block.content)
    const childChars = block.children ? countCharacters(block.children) : 0
    return count + content.length + childChars
  }, 0)
}

// Funkcja do zliczania zadań
export function countTodos(blocks: Block[]): { total: number, completed: number } {
  let total = 0
  let completed = 0
  
  blocks.forEach(block => {
    if (block.type === 'to_do') {
      total++
      if (block.metadata?.checked) {
        completed++
      }
    }
    
    if (block.children) {
      const childStats = countTodos(block.children)
      total += childStats.total
      completed += childStats.completed
    }
  })
  
  return { total, completed }
}

// Funkcja do eksportowania strony jako JSON
export function exportPageAsJSON(title: string, emoji: string, blocks: Block[]) {
  return {
    title,
    emoji,
    blocks: blocksToNotionFormat(blocks),
    exported_at: new Date().toISOString(),
    format_version: '1.0'
  }
}

// Funkcja do importowania strony z JSON
export function importPageFromJSON(jsonData: any): {
  title: string
  emoji: string
  blocks: Block[]
} {
  return {
    title: jsonData.title || 'Untitled',
    emoji: jsonData.emoji || '📝',
    blocks: notionFormatToBlocks(jsonData.blocks || [])
  }
}

// Funkcja do konwersji bloków na prosty tekst
export function blocksToPlainText(blocks: Block[]): string {
  return blocks.map(block => {
    const content = getPlainTextFromRichText(block.content)
    
    let text = ''
    switch (block.type) {
      case 'heading_1':
      case 'heading_2': 
      case 'heading_3':
        text = content.toUpperCase()
        break
      case 'to_do':
        const status = block.metadata?.checked ? '[DONE]' : '[TODO]'
        text = `${status} ${content}`
        break
      default:
        text = content
    }
    
    // Dodaj children
    if (block.children && block.children.length > 0) {
      const childText = blocksToPlainText(block.children)
      text += '\n' + childText
    }
    
    return text
  }).join('\n\n')
}

// Funkcja do grupowania bloków po typie
export function groupBlocksByType(blocks: Block[]): Record<BlockType, Block[]> {
  const groups: Record<BlockType, Block[]> = {
    paragraph: [],
    heading_1: [],
    heading_2: [],
    heading_3: [],
    bulleted_list_item: [],
    numbered_list_item: [],
    to_do: [],
    toggle: []
  }
  
  const addBlocksToGroups = (blockList: Block[]) => {
    blockList.forEach(block => {
      groups[block.type].push(block)
      if (block.children && block.children.length > 0) {
        addBlocksToGroups(block.children)
      }
    })
  }
  
  addBlocksToGroups(blocks)
  return groups
}

// Funkcja do tworzenia template'u strony
export function createPageTemplate(templateType: 'meeting' | 'project' | 'daily' | 'notes'): Block[] {
  switch (templateType) {
    case 'meeting':
      return [
        createBlock('heading_1', 'Meeting Notes'),
        createBlock('heading_2', 'Attendees'),
        createBlock('bulleted_list_item', ''),
        createBlock('heading_2', 'Agenda'),
        createBlock('numbered_list_item', ''),
        createBlock('heading_2', 'Notes'),
        createBlock('paragraph', ''),
        createBlock('heading_2', 'Action Items'),
        createBlock('to_do', '')
      ]
    
    case 'project':
      return [
        createBlock('heading_1', 'Project Plan'),
        createBlock('heading_2', 'Overview'),
        createBlock('paragraph', ''),
        createBlock('heading_2', 'Goals'),
        createBlock('bulleted_list_item', ''),
        createBlock('heading_2', 'Timeline'),
        createBlock('paragraph', ''),
        createBlock('heading_2', 'Tasks'),
        createBlock('to_do', '')
      ]
    
    case 'daily':
      return [
        createBlock('heading_1', 'Daily Notes'),
        createBlock('heading_2', 'Today\'s Goals'),
        createBlock('to_do', ''),
        createBlock('heading_2', 'Notes'),
        createBlock('paragraph', ''),
        createBlock('heading_2', 'Tomorrow'),
        createBlock('bulleted_list_item', '')
      ]
    
    case 'notes':
    default:
      return [
        createBlock('heading_1', 'Notes'),
        createBlock('paragraph', '')
      ]
  }
} 