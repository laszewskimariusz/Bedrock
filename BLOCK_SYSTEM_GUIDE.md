# 🧱 Przewodnik po systemie bloków Bedrock

## Co to jest system bloków?

System bloków to fundament edytora w stylu Notion, gdzie **każdy element treści** (nagłówek, paragraf, lista) to osobny, niezależny blok. Bloki można łączyć, zagnieżdżać, przenosić i formatować.

## 🏗️ Struktura bloku (JSON)

Każdy blok ma standardową strukturę:

```json
{
  "id": "block-1703123456789-abc123",
  "type": "paragraph",
  "content": [
    {
      "type": "text",
      "text": {
        "content": "Treść bloku",
        "link": null
      },
      "annotations": {
        "bold": false,
        "italic": false,
        "strikethrough": false,
        "underline": false,
        "code": false,
        "color": "default"
      }
    }
  ],
  "children": [],
  "metadata": {},
  "created_time": "2024-01-01T00:00:00.000Z",
  "last_edited_time": "2024-01-01T00:00:00.000Z"
}
```

## 📝 Typy bloków

### Podstawowe bloki tekstowe:
- `paragraph` - zwykły tekst
- `heading_1` - duży nagłówek  
- `heading_2` - średni nagłówek
- `heading_3` - mały nagłówek

### Bloki list:
- `bulleted_list_item` - punkt listy z kropką •
- `numbered_list_item` - punkt listy z numerem 1.
- `to_do` - checkbox z zadaniem

### Bloki interaktywne:
- `toggle` - blok rozwijany (z dziećmi)

## 🎯 Jak tworzyć bloki programowo

### Podstawowy blok:
```typescript
import { createBlock } from './app/lib/block-utils'

const paragraph = createBlock('paragraph', 'To jest paragraf')
const heading = createBlock('heading_1', 'Główny nagłówek')
const todo = createBlock('to_do', 'Zadanie do zrobienia')
```

### Template strony:
```typescript
const meetingTemplate = [
  createBlock('heading_1', 'Meeting Notes'),
  createBlock('heading_2', 'Attendees'),
  createBlock('bulleted_list_item', 'John Doe'),
  createBlock('bulleted_list_item', 'Jane Smith'),
  createBlock('heading_2', 'Action Items'),
  createBlock('to_do', 'Przygotować prezentację'),
  createBlock('to_do', 'Wysłać notatki zespołowi')
]
```

## 🔄 Konwersje formatów

### Z Markdown na bloki:
```typescript
import { markdownToBlocks } from './app/lib/block-utils'

const markdown = `
# Mój projekt
## Cele
- Cel pierwszy  
- Cel drugi
- [ ] Zadanie do zrobienia
- [x] Zadanie ukończone

To jest zwykły paragraf.
`

const blocks = markdownToBlocks(markdown)
```

### Z bloków na format Notion API:
```typescript
import { blocksToNotionFormat } from './app/lib/block-utils'

const notionApiBlocks = blocksToNotionFormat(blocks)
// Gotowe do wysłania do Notion API
```

### Z bloków na markdown:
```typescript
import { blocksToMarkdown } from './app/lib/block-utils'

const markdown = blocksToMarkdown(blocks)
console.log(markdown)
// # Mój projekt
// ## Cele
// - Cel pierwszy
// - Cel drugi
// - [ ] Zadanie do zrobienia  
// - [x] Zadanie ukończone
//
// To jest zwykły paragraf.
```

## 🎨 Jak instruować Cursor

### Prompt do tworzenia nowej strony:
```
Stwórz stronę w Bedrock z tytułem "Plan sprintu", emoji 🚀, zawierającą:
- Nagłówek H1 "Sprint Planning"  
- Nagłówek H2 "Cele sprintu"
- Listę punktowaną z 3 celami
- Nagłówek H2 "Zadania"
- Listę checkbox'ów z 5 zadaniami
- Paragraf z podsumowaniem

Użyj funkcji createPageTemplate() i zapisz w localStorage.
```

### Prompt do konwersji:
```
Przekształć ten tekst markdown na bloki Bedrock:

# Raport projektu
## Status: W trakcie
- Backend: 80% gotowy
- Frontend: 60% gotowy  
- [ ] Testy jednostkowe
- [x] Dokumentacja API

Projekt idzie zgodnie z planem.

Użyj funkcji markdownToBlocks() i zwróć strukturę JSON.
```

### Prompt do analizy:
```
Przeanalizuj tę stronę Bedrock i zwróć:
- Liczbę słów
- Liczbę zadań (ukończonych vs nieukończonych)  
- Listę wszystkich nagłówków
- Grupowanie bloków po typach

Użyj funkcji z block-utils.ts: countWords(), groupBlocksByType().
```

## 🛠️ Rozszerzanie systemu

### Dodanie nowego typu bloku:

1. **Dodaj typ do BlockType:**
```typescript
export type BlockType = 
  | 'paragraph'
  | 'heading_1'
  | 'quote'      // ← NOWY TYP
  | // ...reszta
```

2. **Dodaj obsługę w BlockEditor:**
```typescript
const getBlockIcon = (type: BlockType) => {
  switch (type) {
    case 'quote':
      return <span className="text-gray-400 mr-2">❝</span>
    // ...reszta
  }
}

const getBlockStyles = (type: BlockType) => {
  switch (type) {
    case 'quote':
      return 'text-lg italic text-gray-700 border-l-4 border-gray-300 pl-4'
    // ...reszta  
  }
}
```

3. **Dodaj do menu bloków:**
```typescript
const blockTypes = [
  // ...reszta
  { type: 'quote' as BlockType, icon: Quote, label: 'Quote', description: 'Capture a quote.' }
]
```

4. **Dodaj konwersję markdown:**
```typescript
// W markdownToBlocks()
else if (line.startsWith('> ')) {
  block = createBlock('quote', line.substring(2))
}

// W blockToMarkdown()  
case 'quote':
  return `> ${content}`
```

## 📊 Statystyki i analiza

```typescript
import { 
  countWords, 
  countCharacters, 
  groupBlocksByType,
  searchBlocks 
} from './app/lib/block-utils'

// Analiza strony
const stats = {
  words: countWords(blocks),
  characters: countCharacters(blocks),
  blocksByType: groupBlocksByType(blocks),
  todos: blocks.filter(b => b.type === 'to_do'),
  completedTodos: blocks.filter(b => 
    b.type === 'to_do' && b.metadata?.checked
  ).length
}

// Wyszukiwanie
const results = searchBlocks(blocks, 'projekt')
```

## 🚀 Przykłady użycia

### Tworzenie raportu projektowego:
```typescript
const createProjectReport = (projectName: string) => {
  return [
    createBlock('heading_1', `Raport: ${projectName}`),
    createBlock('paragraph', `Status na dzień ${new Date().toLocaleDateString()}`),
    createBlock('heading_2', 'Postęp prac'),
    createBlock('bulleted_list_item', 'Backend - 85%'),
    createBlock('bulleted_list_item', 'Frontend - 70%'),
    createBlock('bulleted_list_item', 'Testy - 40%'),
    createBlock('heading_2', 'Następne kroki'),
    createBlock('to_do', 'Ukończenie modułu uwierzytelniania'),
    createBlock('to_do', 'Implementacja dashboardu'),
    createBlock('to_do', 'Przygotowanie dokumentacji')
  ]
}
```

### Import danych z API:
```typescript
const importFromAPI = async (apiData: any) => {
  const blocks = apiData.items.map((item: any) => {
    return createBlock('paragraph', `${item.title}: ${item.description}`)
  })
  
  return [
    createBlock('heading_1', 'Dane z API'),
    createBlock('paragraph', `Zaimportowano ${blocks.length} elementów`),
    ...blocks
  ]
}
```

## 💡 Best Practices

1. **Używaj unikalnych ID** - każdy blok musi mieć unikalny identyfikator
2. **Zachowaj strukturę rich_text** - nawet dla prostego tekstu
3. **Aktualizuj last_edited_time** - przy każdej zmianie
4. **Waliduj typy bloków** - sprawdzaj czy typ istnieje
5. **Obsługuj błędy parsowania** - szczególnie przy imporcie
6. **Używaj templates** - dla często tworzonych struktur

## 🔗 Integracje

System bloków można łatwo zintegrować z:
- **Notion API** - używając `blocksToNotionFormat()`
- **Obsidian** - poprzez konwersję markdown
- **Confluence** - eksport do HTML
- **Discord/Slack** - jako markdown
- **PDF** - rendering bloków do PDF

Ten system bloków jest w pełni kompatybilny z API Notion i pozwala na łatwą wymianę danych między systemami. 