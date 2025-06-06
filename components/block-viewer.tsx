"use client"

import { Block, BlockType } from './block-editor'
import RichTextRenderer from './rich-text-renderer'
import { CheckSquare } from 'lucide-react'

interface BlockViewerProps {
  blocks: Block[]
  className?: string
}

export default function BlockViewer({ blocks, className = '' }: BlockViewerProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block) => (
        <BlockViewComponent key={block.id} block={block} />
      ))}
    </div>
  )
}

interface BlockViewComponentProps {
  block: Block
}

function BlockViewComponent({ block }: BlockViewComponentProps) {
  const getBlockClassName = (type: BlockType) => {
    switch (type) {
      case 'heading_1':
        return 'text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4'
      case 'heading_2':
        return 'text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-3'
      case 'heading_3':
        return 'text-xl font-medium text-gray-900 dark:text-gray-100 mb-2'
      case 'paragraph':
        return 'text-base text-gray-900 dark:text-gray-100 leading-relaxed mb-2'
      case 'bulleted_list_item':
        return 'text-base text-gray-900 dark:text-gray-100 leading-relaxed ml-6 mb-1'
      case 'numbered_list_item':
        return 'text-base text-gray-900 dark:text-gray-100 leading-relaxed ml-6 mb-1'
      case 'to_do':
        return `text-base leading-relaxed ml-6 mb-1 flex items-start gap-2 ${
          block.metadata?.checked ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'
        }`
      default:
        return 'text-base text-gray-900 dark:text-gray-100 leading-relaxed mb-2'
    }
  }

  const renderBlockContent = () => {
    switch (block.type) {
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
      case 'paragraph':
        return (
          <div className={getBlockClassName(block.type)}>
            <RichTextRenderer content={block.content} />
          </div>
        )

      case 'bulleted_list_item':
        return (
          <div className={getBlockClassName(block.type)}>
            <span className="text-gray-400 mr-3">•</span>
            <RichTextRenderer content={block.content} />
          </div>
        )

      case 'numbered_list_item':
        return (
          <div className={getBlockClassName(block.type)}>
            <span className="text-gray-400 mr-3">1.</span>
            <RichTextRenderer content={block.content} />
          </div>
        )

      case 'to_do':
        return (
          <div className={getBlockClassName(block.type)}>
            <CheckSquare 
              className={`h-4 w-4 mt-0.5 ${
                block.metadata?.checked ? 'text-blue-600' : 'text-gray-400'
              }`}
              fill={block.metadata?.checked ? 'currentColor' : 'none'}
            />
            <span className={block.metadata?.checked ? 'line-through' : ''}>
              <RichTextRenderer content={block.content} />
            </span>
          </div>
        )

      case 'toggle':
        return (
          <details className="mb-2">
            <summary className="cursor-pointer text-base text-gray-900 font-medium hover:bg-gray-50 p-2 rounded">
              <RichTextRenderer content={block.content} />
            </summary>
            <div className="ml-4 mt-2">
              {block.children && block.children.length > 0 && (
                <BlockViewer blocks={block.children} />
              )}
            </div>
          </details>
        )

      default:
        return (
          <div className={getBlockClassName(block.type)}>
            <RichTextRenderer content={block.content} />
          </div>
        )
    }
  }

  return <>{renderBlockContent()}</>
} 