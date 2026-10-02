import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '../Button'

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>)
    const button = screen.getByRole('button', { name: /click me/i })
    expect(button).toBeInTheDocument()
  })

  it('calls onClick handler when clicked', async () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>Click me</Button>)

    const button = screen.getByRole('button')
    await userEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('is disabled when disabled prop is true', () => {
    render(<Button disabled>Click me</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="primary">Primary</Button>)
    const button = container.querySelector('button')
    expect(button).toHaveClass('btn-primary')
  })

  it('renders as loading state when loading prop is true', () => {
    const { container } = render(<Button isLoading={true}>Click me</Button>)
    const button = container.querySelector('button')
    expect(button).toBeDisabled()
  })
})
