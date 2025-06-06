"use client"

import { RichText } from './block-editor'

interface RichTextRendererProps {
  content: RichText[]
  className?: string
}

export default function RichTextRenderer({ content, className = '' }: RichTextRendererProps) {
  return (
    <span className={className}>
      {content.map((part, index) => {
        const annotations = part.annotations || {}
        let className = ''
        
        // Buduj klasy CSS na podstawie annotacji
        if (annotations.bold) className += ' font-bold'
        if (annotations.italic) className += ' italic'
        if (annotations.strikethrough) className += ' line-through'
        if (annotations.underline) className += ' underline'
        if (annotations.code) className += ' bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm font-mono'
        
        // Kolory tekstu
        if (annotations.color && annotations.color !== 'default') {
          switch (annotations.color) {
            case 'red':
              className += ' text-red-600'
              break
            case 'blue':
              className += ' text-blue-600'
              break
            case 'green':
              className += ' text-green-600'
              break
            case 'yellow':
              className += ' text-yellow-600'
              break
            case 'purple':
              className += ' text-purple-600'
              break
            case 'gray':
              className += ' text-gray-500'
              break
          }
        }
        
        return (
          <span key={index} className={className.trim()}>
            {part.text.link ? (
              <a 
                href={part.text.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline"
              >
                {part.text.content}
              </a>
            ) : (
              part.text.content
            )}
          </span>
        )
      })}
    </span>
  )
} 