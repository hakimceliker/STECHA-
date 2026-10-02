'use client'

import React from 'react'

interface LoadingSkeletonProps {
  lines?: number
  className?: string
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Loading content">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded animate-pulse"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}

interface CardSkeletonProps {
  className?: string
}

export function CardSkeleton({ className = '' }: CardSkeletonProps) {
  return (
    <div className={`space-y-4 ${className}`} role="status" aria-label="Loading card">
      <div className="h-6 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded animate-pulse w-1/3" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-4 bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700 rounded animate-pulse"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  )
}
