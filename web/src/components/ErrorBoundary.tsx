'use client'

import React, { ReactNode, Component, ErrorInfo } from 'react'
import { Card } from './Card'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
          <div className="max-w-2xl mx-auto">
            <Card className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full mb-6">
                <span className="text-3xl">⚠️</span>
              </div>
              <h1 className="text-2xl font-bold text-white mb-4">Something went wrong</h1>
              <p className="text-slate-400 mb-6">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
              <Button onClick={this.resetError} className="w-full">
                Try again
              </Button>
            </Card>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
