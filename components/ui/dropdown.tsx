"use client"

import React, { useState, useRef, useEffect } from 'react'

interface DropdownProps {
  trigger: React.ReactNode
  children: React.ReactNode
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ trigger, children, align = 'left', className = '' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
        {trigger}
      </div>
      {isOpen && (
        <div 
          className={`
            absolute z-50 mt-1 min-w-[200px] rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl
            ${align === 'right' ? 'right-0' : 'left-0'}
            ${className}
          `}
        >
          {children}
        </div>
      )}
    </div>
  )
}

interface DropdownItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  icon?: React.ReactNode
}

export function DropdownItem({ children, onClick, className = '', icon }: DropdownItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-2 px-3 py-2 text-sm cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors
        first:rounded-t-lg last:rounded-b-lg
        ${className}
      `}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      <span>{children}</span>
    </div>
  )
}

export function DropdownSeparator() {
  return <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
} 