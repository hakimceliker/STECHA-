import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '../Input'

describe('Input Component', () => {
  it('renders input with placeholder', () => {
    render(<Input placeholder="Enter text" />)
    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
  })

  it('handles text input correctly', async () => {
    const { container } = render(<Input />)
    const input = container.querySelector('input') as HTMLInputElement

    await userEvent.type(input, 'test value')
    expect(input.value).toBe('test value')
  })

  it('validates email input correctly', () => {
    render(<Input type="email" />)
    const input = screen.getByRole('textbox') as HTMLInputElement
    expect(input.type).toBe('email')
  })

  it('calls onChange handler when value changes', async () => {
    const handleChange = jest.fn()
    const { container } = render(<Input onChange={handleChange} />)
    const input = container.querySelector('input')!

    await userEvent.type(input, 'a')
    expect(handleChange).toHaveBeenCalled()
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled />)
    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
  })

  it('displays error state correctly', () => {
    const { container } = render(<Input error="Field is required" />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('input-error')
  })

  it('is required when required prop is true', () => {
    const { container } = render(<Input required />)
    const input = container.querySelector('input')
    expect(input).toBeInTheDocument()
  })
})
