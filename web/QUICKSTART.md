# Stech AI Web - Quick Start Guide

Welcome to the Stech AI web frontend! This guide will help you get started with development.

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with fonts
│   │   ├── globals.css         # Global styles & design tokens
│   │   └── page.tsx            # Home page
│   └── components/
│       ├── Button.tsx          # Button component
│       ├── Input.tsx           # Input & Textarea components
│       ├── Card.tsx            # Card component system
│       ├── Badge.tsx           # Badge component
│       └── index.ts            # Component exports
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── next.config.js              # Next.js configuration
├── package.json                # Dependencies
├── COMPONENTS.md               # Component documentation
└── QUICKSTART.md              # This file
```

## Design System

The project uses a custom design system based on Tailwind CSS with predefined colors, typography, and components.

### Key Files

- **DESIGN_SYSTEM.md** - Complete design system documentation
- **COMPONENTS.md** - Component library guide with examples
- **src/app/globals.css** - Design tokens and base styles
- **tailwind.config.ts** - Tailwind theme configuration

## Development Workflow

### Creating a New Page

1. Create a new folder in `src/app/[page-name]`
2. Add `page.tsx` with your page component
3. Optionally add `layout.tsx` for page-specific layout

```tsx
// src/app/chat/page.tsx
'use client'

import { Button, Card } from '@/components'

export default function ChatPage() {
  return (
    <div className="container-responsive py-8">
      <h1 className="h1 mb-4">Chat with Stech AI</h1>
      <Card>
        {/* Your content */}
      </Card>
    </div>
  )
}
```

### Using Components

```tsx
import { Button, Input, Card, Badge } from '@/components'

export default function MyPage() {
  return (
    <Card>
      <h3 className="h3">Form Example</h3>
      <Input label="Name" placeholder="Enter your name" required />
      <Button variant="primary" size="lg">Submit</Button>
      <Badge variant="success">Completed</Badge>
    </Card>
  )
}
```

### Styling

Use Tailwind classes for all styling:

```tsx
<div className="bg-slate-50 p-6 rounded-lg shadow-md hover:shadow-lg">
  <p className="text-slate-900 font-semibold">Content</p>
</div>
```

**Common utility classes:**
- Spacing: `p-4`, `m-2`, `gap-6`
- Colors: `text-primary-600`, `bg-slate-100`, `border-error-500`
- Typography: `h1`, `h2`, `body`, `body-sm`
- Responsive: `md:grid-cols-2`, `lg:hidden`
- Dark mode: `dark:bg-slate-900`, `dark:text-white`

## Component Quick Reference

### Button

```tsx
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button size="lg" fullWidth>Full Width Large</Button>
```

### Input

```tsx
<Input label="Email" type="email" placeholder="you@example.com" />
<Input label="Password" type="password" error="Required" required />
```

### Card

```tsx
<Card variant="filled">
  <CardHeader>
    <h3 className="h3">Title</h3>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Badge

```tsx
<Badge variant="primary">Primary</Badge>
<Badge variant="success" size="sm">Small</Badge>
```

## Colors

Access design system colors:

- **Primary**: `primary`, `primary-50` to `primary-950`
- **Secondary**: `secondary`, `secondary-50` to `secondary-950`
- **Semantic**: `success`, `warning`, `error`, `info`
- **Neutral**: `slate`, `slate-50` to `slate-950`

Example:
```tsx
<div className="bg-primary-600 text-white p-4">Blue background</div>
<p className="text-error-600">Error message</p>
```

## Forms

Create forms with proper structure:

```tsx
'use client'

import { useState } from 'react'
import { Input, Button } from '@/components'

export default function ContactForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError('Email is required')
      return
    }
    
    setError('')
    // Handle form submission
    console.log('Email:', email)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={error}
        placeholder="you@example.com"
        required
      />
      <Button type="submit" fullWidth>Send</Button>
    </form>
  )
}
```

## Responsive Design

Use Tailwind's responsive prefixes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
  {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
</div>
```

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## Dark Mode

All components support dark mode automatically.

Test dark mode:
1. Open DevTools → Rendering tab
2. Set "Emulate CSS media feature prefers-color-scheme" to "dark"

Add dark-specific styles:
```tsx
<div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
  Content adapts to dark mode
</div>
```

## API Integration

For API calls, use `axios`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'

export default function DataPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    axios
      .get('http://localhost:8000/api/v1/chat')
      .then(response => setData(response.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>

  return <div>{JSON.stringify(data)}</div>
}
```

**Backend URL:** `http://localhost:8000` (local dev)

## Building for Production

```bash
npm run build
npm run start
```

## Troubleshooting

### Styles not applying?
- Make sure you have `npm install` run
- Check that `globals.css` is imported in `layout.tsx`
- Clear `.next` folder: `rm -rf .next`

### Components not found?
- Check that component is exported in `src/components/index.ts`
- Verify import path: `from '@/components'`

### Dark mode not working?
- Check browser DevTools rendering settings
- Ensure `prefers-color-scheme: dark` is set in OS/browser

## Learning Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [Design System](./DESIGN_SYSTEM.md)
- [Components Guide](./COMPONENTS.md)

## Common Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run linter
npm run lint
```

## Next Steps

1. Review [DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md) for complete design guidelines
2. Check [COMPONENTS.md](./COMPONENTS.md) for component usage examples
3. Start building pages in `src/app/`
4. Create new components in `src/components/` as needed

---

**Happy coding! 🚀**
