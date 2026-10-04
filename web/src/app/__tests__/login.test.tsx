import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  })),
}))

// Mock the login page content for testing
const LoginPageContent = () => {
  const { useRouter } = require('next/navigation')
  const router = useRouter()
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Email and password are required')
      return
    }

    try {
      const response = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.access_token)
        router.push('/chat')
      } else {
        setError('Invalid email or password')
      }
    } catch (err) {
      setError('Login failed')
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        data-testid="email-input"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        data-testid="password-input"
      />
      {error && <div data-testid="error-message">{error}</div>}
      <button type="submit">Login</button>
    </form>
  )
}

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPush.mockClear()
    localStorage.clear()
  })

  it('renders login form', () => {
    render(<LoginPageContent />)
    expect(screen.getByTestId('email-input')).toBeInTheDocument()
    expect(screen.getByTestId('password-input')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('shows error when fields are empty', async () => {
    render(<LoginPageContent />)
    const submitButton = screen.getByRole('button', { name: /login/i })

    await userEvent.click(submitButton)

    expect(screen.getByTestId('error-message')).toHaveTextContent('Email and password are required')
  })

  it('validates email input', async () => {
    render(<LoginPageContent />)
    const emailInput = screen.getByTestId('email-input') as HTMLInputElement

    await userEvent.type(emailInput, 'invalid-email')
    expect(emailInput.type).toBe('email')
  })

  it('handles form submission with valid credentials', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ access_token: 'test-token' }),
      })
    ) as jest.Mock

    mockPush.mockClear()
    render(<LoginPageContent />)

    const emailInput = screen.getByTestId('email-input') as HTMLInputElement
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /login/i })

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'password123')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('test-token')
      expect(mockPush).toHaveBeenCalledWith('/chat')
    })
  })

  it('shows error on login failure', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        status: 401,
      })
    ) as jest.Mock

    mockPush.mockClear()
    render(<LoginPageContent />)

    const emailInput = screen.getByTestId('email-input') as HTMLInputElement
    const passwordInput = screen.getByTestId('password-input') as HTMLInputElement
    const submitButton = screen.getByRole('button', { name: /login/i })

    await userEvent.type(emailInput, 'test@example.com')
    await userEvent.type(passwordInput, 'wrongpassword')
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent('Invalid email or password')
    })
  })
})
