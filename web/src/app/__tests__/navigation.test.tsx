import { render, screen } from '@testing-library/react'
import React from 'react'

const mockPush = jest.fn()
const mockRouter = {
  push: mockPush,
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
}

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => mockRouter),
}))

// Protected route wrapper component for testing
const ProtectedRoute = ({ children, requiredRole = 'user' }: { children: React.ReactNode; requiredRole?: string }) => {
  const { useRouter } = require('next/navigation')
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = React.useState(false)

  React.useEffect(() => {
    const token = localStorage.getItem('token')
    const userRole = localStorage.getItem('role')

    if (!token) {
      router.push('/login')
      return
    }

    if (requiredRole === 'admin' && userRole !== 'admin') {
      router.push('/')
      return
    }

    setIsAuthorized(true)
  }, [router, requiredRole])

  if (!isAuthorized) return null
  return <>{children}</>
}

describe('Navigation and Role-Based Access', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('redirects to login when no token present', () => {
    render(
      <ProtectedRoute>
        <div>Protected Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('allows access to regular user pages with valid token', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'user')
    mockPush.mockClear()

    render(
      <ProtectedRoute>
        <div>User Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).not.toHaveBeenCalled()
  })

  it('redirects to home when non-admin tries to access admin route', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'user')
    mockPush.mockClear()

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('allows admin access to admin routes', () => {
    localStorage.setItem('token', 'valid-token')
    localStorage.setItem('role', 'admin')
    mockPush.mockClear()

    render(
      <ProtectedRoute requiredRole="admin">
        <div>Admin Content</div>
      </ProtectedRoute>
    )

    expect(mockPush).not.toHaveBeenCalled()
  })
})
