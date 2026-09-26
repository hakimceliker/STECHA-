import { render, screen } from '@testing-library/react'
import React from 'react'

// Demo mode component for testing
const DemoModeIndicator = ({ isDemoMode }: { isDemoMode: boolean }) => {
  if (!isDemoMode) return null

  return (
    <div data-testid="demo-badge" className="demo-badge">
      <span className="demo-label">Demo Mode</span>
      <span className="demo-message">This is a demo environment. Features are limited.</span>
    </div>
  )
}

// Chat component with demo mode label
const ChatComponent = ({ isDemoMode = true }: { isDemoMode?: boolean }) => {
  return (
    <div className="chat-container">
      <DemoModeIndicator isDemoMode={isDemoMode} />
      <div data-testid="chat-message-input" className="input-area">
        <input type="text" placeholder="Type a message..." disabled={isDemoMode} />
        {isDemoMode && <div data-testid="demo-message">Chat is disabled in demo mode</div>}
      </div>
    </div>
  )
}

describe('Demo Mode Labels and Features', () => {
  it('displays demo mode badge when in demo mode', () => {
    render(<DemoModeIndicator isDemoMode={true} />)
    expect(screen.getByTestId('demo-badge')).toBeInTheDocument()
    expect(screen.getByText('Demo Mode')).toBeInTheDocument()
  })

  it('does not display demo badge when not in demo mode', () => {
    render(<DemoModeIndicator isDemoMode={false} />)
    expect(screen.queryByTestId('demo-badge')).not.toBeInTheDocument()
  })

  it('shows demo message in chat when in demo mode', () => {
    render(<ChatComponent isDemoMode={true} />)
    expect(screen.getByTestId('demo-message')).toHaveTextContent('Chat is disabled in demo mode')
  })

  it('enables chat input when not in demo mode', () => {
    render(<ChatComponent isDemoMode={false} />)
    const input = screen.getByPlaceholderText('Type a message...')
    expect(input).not.toBeDisabled()
  })

  it('disables chat input in demo mode', () => {
    render(<ChatComponent isDemoMode={true} />)
    const input = screen.getByPlaceholderText('Type a message...')
    expect(input).toBeDisabled()
  })

  it('displays demo limitations message', () => {
    render(<DemoModeIndicator isDemoMode={true} />)
    expect(screen.getByText(/demo environment/i)).toBeInTheDocument()
  })
})
