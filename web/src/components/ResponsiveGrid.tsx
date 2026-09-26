'use client'

import React, { ReactNode } from 'react'

interface ResponsiveGridProps {
  children: ReactNode
  cols?: {
    mobile?: number
    tablet?: number
    desktop?: number
  }
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export function ResponsiveGrid({
  children,
  cols = { mobile: 1, tablet: 2, desktop: 3 },
  gap = 'md',
  className = '',
}: ResponsiveGridProps) {
  const gapMap = {
    sm: 'gap-2',
    md: 'gap-4',
    lg: 'gap-6',
  }

  const colsMap = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
  }

  const tabletColsMap = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  }

  return (
    <div
      className={`
        grid 
        grid-cols-${cols.mobile || 1}
        ${tabletColsMap[(cols.tablet || cols.mobile || 1) as keyof typeof tabletColsMap]}
        ${colsMap[(cols.desktop || 3) as keyof typeof colsMap]}
        ${gapMap[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  )
}
