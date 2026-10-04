import React from 'react'
import clsx from 'clsx'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  success?: boolean
  helperText?: string
  required?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      label,
      error,
      success,
      helperText,
      required,
      type = 'text',
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-body-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="ml-1 text-red-600">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'input',
            error && 'input-error',
            success && 'input-success',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-body-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {!error && helperText && (
          <p className="mt-1 text-body-sm text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  required?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      required,
      ...props
    },
    ref
  ) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-body-sm font-semibold text-slate-700 dark:text-slate-300">
            {label}
            {required && <span className="ml-1 text-red-600">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={clsx(
            'input resize-none',
            error && 'input-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-body-sm text-red-600 dark:text-red-400">{error}</p>
        )}
        {!error && helperText && (
          <p className="mt-1 text-body-sm text-slate-500 dark:text-slate-400">{helperText}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
