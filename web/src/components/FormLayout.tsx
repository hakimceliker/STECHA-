import React from 'react'
import clsx from 'clsx'

interface FormLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export const FormLayout = React.forwardRef<HTMLDivElement, FormLayoutProps>(
  ({ title, subtitle, children, className, ...props }, ref) => (
    <div
      ref={ref}
      className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4"
      {...props}
    >
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-blue-600 mb-2">🚀</div>
          <h1 className="h2 text-slate-900 dark:text-white mb-2">Stech AI</h1>
          <h2 className="h4 text-slate-600 dark:text-slate-300 mb-4">{title}</h2>
          {subtitle && (
            <p className="body-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        {/* Form Card */}
        <div
          className={clsx(
            'bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8',
            className
          )}
        >
          {children}
        </div>
      </div>
    </div>
  )
)

FormLayout.displayName = 'FormLayout'
