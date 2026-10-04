# Stech AI - Component Library & Style Guide

This guide documents all available components in the Stech AI design system and how to use them.

## Getting Started

All components are located in `/src/components` and exported from `/src/components/index.ts`.

### Importing Components

```tsx
import { Button, Card, Input, Badge } from '@/components'
```

---

## Button Component

The Button component is used for all clickable actions.

### Basic Usage

```tsx
<Button>Click me</Button>
```

### Variants

#### Primary (Default)
Used for main CTAs - reservations, confirmations, purchases.
```tsx
<Button variant="primary">Reserve a Table</Button>
```

#### Secondary
Used for secondary actions - cancel, back, settings.
```tsx
<Button variant="secondary">Cancel</Button>
```

#### Outline
Used for tertiary actions - view more, optional actions.
```tsx
<Button variant="outline">Learn More</Button>
```

#### Ghost
Used for minimal actions - inline links, light interactions.
```tsx
<Button variant="ghost">Help</Button>
```

#### Danger
Used for destructive actions - delete, reject, remove.
```tsx
<Button variant="danger">Delete Account</Button>
```

### Sizes

```tsx
<Button size="sm">Small</Button>
<Button size="md">Medium (Default)</Button>
<Button size="lg">Large</Button>
```

### States

#### Loading State
```tsx
<Button isLoading={true}>Processing...</Button>
```

#### Full Width
```tsx
<Button fullWidth>Full Width Button</Button>
```

#### Disabled
```tsx
<Button disabled>Disabled Button</Button>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `primary \| secondary \| outline \| ghost \| danger` | `primary` | Button style variant |
| size | `sm \| md \| lg` | `md` | Button size |
| isLoading | boolean | `false` | Show loading spinner |
| fullWidth | boolean | `false` | Stretch to full width |
| disabled | boolean | `false` | Disable the button |
| onClick | function | - | Click handler |

---

## Input Component

The Input component is for single-line text input with labels, errors, and helper text.

### Basic Usage

```tsx
<Input 
  label="Email Address"
  placeholder="you@example.com"
/>
```

### With Validation

```tsx
<Input
  label="Password"
  type="password"
  error="Password is required"
  required
/>
```

### With Helper Text

```tsx
<Input
  label="Username"
  helperText="Must be between 3-20 characters"
  placeholder="johndoe"
/>
```

### Success State

```tsx
<Input
  label="Email"
  success={true}
  value="confirmed@example.com"
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| label | string | - | Label text |
| error | string | - | Error message (shows error state) |
| success | boolean | `false` | Show success state |
| helperText | string | - | Helper text below input |
| required | boolean | `false` | Show required asterisk |
| type | string | `text` | HTML input type |
| placeholder | string | - | Placeholder text |
| disabled | boolean | `false` | Disable input |

---

## Textarea Component

The Textarea component is for multi-line text input.

### Basic Usage

```tsx
<Textarea
  label="Special Requests"
  placeholder="Any special requirements for your reservation?"
  rows={4}
/>
```

### With Validation

```tsx
<Textarea
  label="Comments"
  error="Please provide more details"
  required
/>
```

### Props

Same as Input component, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| rows | number | - | Number of visible rows |
| cols | number | - | Number of visible columns |

---

## Card Component

The Card component is a container for grouping related content.

### Basic Usage

```tsx
<Card>
  <p>Your content here</p>
</Card>
```

### With Header and Footer

```tsx
<Card>
  <CardHeader>
    <h3 className="h3">Reservation Details</h3>
  </CardHeader>
  <CardContent>
    <p>Your reservation information</p>
  </CardContent>
  <CardFooter>
    <Button>Confirm</Button>
  </CardFooter>
</Card>
```

### Variants

#### Outlined (Default)
```tsx
<Card variant="outlined">
  <p>Standard card with border</p>
</Card>
```

#### Elevated
```tsx
<Card variant="elevated">
  <p>Card with drop shadow</p>
</Card>
```

#### Filled
```tsx
<Card variant="filled">
  <p>Card with background color</p>
</Card>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `outlined \| elevated \| filled` | `outlined` | Card style |
| className | string | - | Additional CSS classes |

---

## Badge Component

The Badge component is for labeling and categorizing content.

### Basic Usage

```tsx
<Badge>New</Badge>
```

### Variants

```tsx
<Badge variant="primary">Featured</Badge>
<Badge variant="success">Confirmed</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="error">Cancelled</Badge>
```

### Sizes

```tsx
<Badge size="sm">Small Badge</Badge>
<Badge size="md">Medium Badge (Default)</Badge>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| variant | `primary \| success \| warning \| error` | `primary` | Badge color |
| size | `sm \| md` | `md` | Badge size |

---

## Layout & Spacing

### Container Classes

Use the responsive container utility class:

```tsx
<div className="container-responsive">
  <p>Content is centered and padded</p>
</div>
```

### Spacing Scale

Spacing follows an 8px base unit:

```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Usage in CSS

```css
/* With Tailwind classes */
<div className="p-6 m-4 gap-4">
```

### Responsive Grids

```tsx
<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
  <Card>Column 1</Card>
  <Card>Column 2</Card>
  <Card>Column 3</Card>
</div>
```

---

## Typography Classes

Apply typography with predefined classes:

```tsx
<h1 className="h1">Page Title</h1>
<h2 className="h2">Section Heading</h2>
<h3 className="h3">Subsection</h3>
<h4 className="h4">Small Heading</h4>

<p className="body-lg">Large body text</p>
<p className="body">Regular body text</p>
<p className="body-sm">Small body text</p>

<label className="label">Form Label</label>
<p className="caption">Caption or small text</p>
```

### Font Classes

```tsx
<p className="font-display">Display font (Poppins)</p>
<p className="font-sans">Sans-serif font (Inter)</p>
<p className="font-mono">Monospace font (JetBrains Mono)</p>
```

---

## Color Utilities

### Text Colors

```tsx
<p className="text-slate-900">Dark text</p>
<p className="text-slate-500">Gray text</p>
<p className="text-primary-600">Blue text</p>
<p className="text-success-600">Green text</p>
```

### Background Colors

```tsx
<div className="bg-slate-100">Light background</div>
<div className="bg-primary-600">Blue background</div>
<div className="bg-warning-400">Warning background</div>
```

### Border Colors

```tsx
<div className="border-2 border-primary-600">Blue border</div>
<div className="border border-error-500">Red border</div>
```

---

## Common Patterns

### Form Section

```tsx
<div className="space-y-4">
  <Input
    label="Full Name"
    placeholder="John Doe"
    required
  />
  <Input
    label="Email"
    type="email"
    placeholder="john@example.com"
    required
  />
  <Textarea
    label="Message"
    placeholder="Your message here"
  />
  <Button fullWidth>Submit</Button>
</div>
```

### Feature Card Grid

```tsx
<div className="grid gap-8 md:grid-cols-3">
  <Card variant="filled">
    <CardHeader>
      <span className="text-3xl">🍽️</span>
      <h4 className="h4">Feature Name</h4>
    </CardHeader>
    <CardContent>
      <p className="body-sm">Feature description</p>
    </CardContent>
  </Card>
</div>
```

### Alert/Banner

```tsx
<Card className="bg-blue-50 border-l-4 border-blue-500 dark:bg-blue-900/20">
  <p className="body text-blue-900 dark:text-blue-200">
    📢 Important information
  </p>
</Card>
```

### Empty State

```tsx
<Card variant="filled" className="text-center py-12">
  <p className="text-4xl mb-4">🎯</p>
  <h4 className="h4 mb-2">No reservations yet</h4>
  <p className="body-sm text-slate-500 mb-4">
    Make your first reservation to get started
  </p>
  <Button>Browse Restaurants</Button>
</Card>
```

---

## Accessibility Guidelines

### Buttons
- Always provide descriptive text or aria-label
- Ensure focus state is visible (built-in with focus:ring classes)

```tsx
<Button aria-label="Close dialog">✕</Button>
```

### Forms
- Always use label for accessibility
- Link labels to inputs with htmlFor

```tsx
<Input
  id="email"
  label="Email Address"
  type="email"
/>
```

### Semantic HTML
- Use `<button>` elements for actions
- Use proper heading hierarchy (h1, h2, h3)
- Use `<nav>` for navigation regions

---

## Dark Mode

All components automatically support dark mode using Tailwind's `dark:` prefix.

Test dark mode in browser DevTools:
1. Open DevTools (F12)
2. Click the three dots menu → More tools → Rendering
3. Set "Emulate CSS media feature prefers-color-scheme" to "dark"

Components will automatically adapt colors for readability and visual hierarchy.

---

## Customization

### Adding Custom Variants

Edit `tailwind.config.ts` to add new colors or modify existing ones:

```ts
theme: {
  extend: {
    colors: {
      'custom': {
        50: '#f0f9ff',
        // ... more shades
        900: '#0c2d46',
      }
    }
  }
}
```

### Creating New Components

1. Create new file in `/src/components/YourComponent.tsx`
2. Use TypeScript for type safety
3. Export interface and component
4. Add to `/src/components/index.ts`

```tsx
export interface YourComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'secondary'
}

export const YourComponent = React.forwardRef<HTMLDivElement, YourComponentProps>(
  ({ variant = 'primary', ...props }, ref) => (
    <div ref={ref} className="your-classes" {...props} />
  )
)

YourComponent.displayName = 'YourComponent'
```

---

## Browser Support

- Chrome/Edge (Latest)
- Firefox (Latest)
- Safari (Latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Design System (DESIGN_SYSTEM.md)](../DESIGN_SYSTEM.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)

---

**Version**: 1.0  
**Last Updated**: 2026-09-26  
**Status**: Active Development
