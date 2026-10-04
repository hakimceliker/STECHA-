# Stech AI - Design System

## 1. Brand Identity

### Brand Name
**Stech AI** - Türkçe AI Asistan Platformu

### Brand Mission
Türkiye'deki restoranlar ve kullanıcılar arasında AI-destekli bir köprü oluşturarak, masa rezervasyonu, ön sipariş ve müşteri hizmetlerini akıllı ve kişiselleştirilmiş hale getirmek.

### Brand Values
- **Yapay Zeka Odaklı**: Kullanıcı deneyiminin her noktasında AI'dan yararlanma
- **Türkçe Merkez**: Türkçe konuşan kullanıcılar için optimize edilmiş
- **Hızlı ve Güvenilir**: Instant işlemler, güvenli ödemeler, güvenilir rezervasyonlar
- **Restoranlar İçin**: İşletmecilerin işini kolaylaştıran yönetim araçları
- **Şeffaf ve Adil**: Tüm taraflara eşit değer sunma

## 2. Color Palette

### Primary Colors

| Color | Hex | RGB | Usage |
|-------|-----|-----|-------|
| **Stech Blue** | `#2563EB` | `37, 99, 235` | Primary CTAs, headers, active states |
| **Stech Orange** | `#F97316` | `249, 115, 22` | Highlights, notifications, accents |
| **Stech Green** | `#10B981` | `16, 185, 129` | Success states, confirmations |
| **Stech Red** | `#EF4444` | `239, 68, 68` | Errors, warnings, rejections |

### Neutral Colors

| Color | Hex | Usage |
|-------|-----|-------|
| **Dark Slate** | `#0F172A` | Dark backgrounds, text on light |
| **Slate 700** | `#334155` | Secondary backgrounds |
| **Slate 400** | `#94A3B8` | Secondary text, borders |
| **Slate 100** | `#F1F5F9` | Light backgrounds, cards |
| **White** | `#FFFFFF` | Primary backgrounds, text on dark |

### Semantic Colors

```css
--color-success: #10B981;    /* Green - Success states */
--color-warning: #F59E0B;    /* Amber - Warnings */
--color-error: #EF4444;      /* Red - Errors */
--color-info: #3B82F6;       /* Blue - Information */
```

## 3. Typography System

### Font Family
- **Primary**: `Inter` (sans-serif) - Web, apps, UI text
- **Display**: `Poppins` (sans-serif) - Headings, branding
- **Monospace**: `JetBrains Mono` - Code, technical content

### Type Scale

| Role | Font Size | Line Height | Font Weight | Letter Spacing |
|------|-----------|-------------|------------|-----------------|
| **H1 - Page Title** | 48px | 1.2 (57.6px) | 700 (Bold) | -1px |
| **H2 - Section** | 36px | 1.3 (46.8px) | 700 (Bold) | -0.5px |
| **H3 - Subsection** | 28px | 1.4 (39.2px) | 600 (Semibold) | 0px |
| **H4 - Small Heading** | 20px | 1.5 (30px) | 600 (Semibold) | 0px |
| **Body Large** | 18px | 1.6 (28.8px) | 400 (Regular) | 0px |
| **Body** | 16px | 1.6 (25.6px) | 400 (Regular) | 0px |
| **Body Small** | 14px | 1.5 (21px) | 400 (Regular) | 0.5px |
| **Label** | 12px | 1.5 (18px) | 600 (Semibold) | 1px |
| **Caption** | 12px | 1.4 (16.8px) | 400 (Regular) | 0px |

## 4. Component Library

### Buttons

#### Button Types
- **Primary**: Stech Blue background, white text - main CTAs
- **Secondary**: Slate 700 background, white text - secondary actions
- **Outline**: White/Slate background, blue border - tertiary actions
- **Danger**: Red background, white text - destructive actions
- **Ghost**: Transparent background, blue text - minimal actions

#### Button Sizes
- **Large**: `py-3 px-6` (48px height)
- **Medium**: `py-2 px-4` (40px height) - default
- **Small**: `py-1 px-3` (32px height)

#### Button States
- Default
- Hover (darker shade)
- Active (underline/shadow)
- Disabled (opacity 50%, no cursor)
- Loading (spinner indicator)

### Input Fields

#### Text Input
```
- Border: 1px slate-400
- Padding: py-2 px-3
- Focus: border-blue-600, shadow-md
- Error: border-red-500, bg-red-50
- Success: border-green-500
- Disabled: bg-slate-100, text-slate-400
```

#### Form Label
```
- Font: Body Small, Semibold, Slate 700
- Margin Bottom: 8px
- Required indicator: red asterisk
```

### Cards

#### Card Structure
```
- Background: white or slate-50
- Border: 1px solid slate-200
- Border Radius: rounded-lg (8px)
- Padding: p-6
- Shadow: shadow-sm (0 1px 2px rgba)
- Hover: shadow-md
```

#### Card Variants
- **Elevated**: shadow-md for emphasis
- **Outlined**: border only, no shadow
- **Filled**: slate-50 background

### Navigation

#### Top Bar
```
- Background: white with subtle shadow
- Height: 64px
- Padding: px-6 py-4
- Layout: Flex between logo and nav items
```

#### Sidebar (Admin/Owner Dashboard)
```
- Width: 280px (collapsible to 64px)
- Background: slate-900 (dark theme)
- Color: white text
- Active item: bg-blue-600
```

#### Breadcrumbs
```
- Font: Body Small
- Separator: "/"
- Color: slate-600, active is blue
```

### Modal/Dialog

```
- Overlay: rgba(0,0,0,0.5)
- Background: white
- Border Radius: rounded-xl (12px)
- Padding: p-6
- Max Width: 500px (md), 600px (lg)
- Shadows: shadow-xl
- Close Button: top-right, x icon
```

### Tables

```
- Header: bg-slate-50, font-semibold
- Rows: white with border-bottom
- Hover: bg-blue-50
- Padding: px-4 py-3
- Alternate rows: bg-slate-50 (optional)
```

## 5. Layout & Spacing

### Spacing Scale (8px base)
```
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
3xl: 64px
```

### Container Widths
- **Mobile**: Full width - 16px padding (sm: 640px)
- **Tablet**: 640px (md: 768px)
- **Desktop**: 1024px (lg: 1024px)
- **Full**: 1280px (xl: 1280px)

### Grid System
- Columns: 12-column grid
- Gutter: 16px (md spacing)
- Responsive: 1 col (mobile), 2 cols (tablet), 3-4 cols (desktop)

## 6. Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --primary: #2563EB;
  --primary-light: #3B82F6;
  --primary-dark: #1D4ED8;
  
  --secondary: #F97316;
  --secondary-light: #FB923C;
  --secondary-dark: #EA580C;
  
  --success: #10B981;
  --warning: #F59E0B;
  --error: #EF4444;
  --info: #3B82F6;
  
  --bg-primary: #FFFFFF;
  --bg-secondary: #F1F5F9;
  --bg-tertiary: #334155;
  
  --text-primary: #0F172A;
  --text-secondary: #475569;
  --text-tertiary: #94A3B8;
  
  /* Typography */
  --font-primary: "Inter", sans-serif;
  --font-display: "Poppins", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

## 7. Page Layouts

### Landing Page
1. **Hero Section**: Full-width background, centered CTA, value proposition
2. **Features Grid**: 3-4 feature cards with icons
3. **CTA Section**: "Get Started" primary button
4. **Footer**: Links, social, branding

### Authentication Pages (Login/Register)
- **Left**: Brand info, features, design pattern
- **Right**: Form (mobile: single column)
- **Centered**: Logo, form, social signin options

### Dashboard Layout
- **Sidebar**: Navigation (admin/owner)
- **Top Bar**: Breadcrumbs, user menu, notifications
- **Main Content**: Page-specific content
- **Footer**: Minimal footer with copyright

### Chat Interface
- **Left Panel**: Conversation history (desktop only)
- **Center**: Chat messages, input field
- **Right Panel**: Current reservation/order (desktop only)
- **Mobile**: Bottom sheet for history, full-width chat

### Restaurant Listing Page
- **Filters**: Sidebar (left) or top filters
- **Grid**: 2-4 columns, restaurant cards with images
- **Card**: Image, name, rating, cuisine type, distance

## 8. Interaction & Animation

### Transitions
- **Button hover**: 150ms
- **Modal appearance**: 200ms
- **Tooltip**: 100ms fade-in
- **Page transition**: 300ms

### Micro-interactions
- **Hover State**: Slight scale (1.02) + shadow increase
- **Active State**: Border color change, background highlight
- **Loading**: Spinner or skeleton loading
- **Toast/Alert**: Slide in from top/bottom, auto-dismiss

## 9. Accessibility Guidelines

- **Color Contrast**: WCAG AA minimum (4.5:1 for text)
- **Focus States**: Visible blue outline (2px)
- **Icons + Text**: Always label icons with aria-label
- **Form Labels**: Always associate with inputs (for/id)
- **Keyboard Nav**: All interactive elements tabable
- **Alt Text**: All images have descriptive alt text
- **Semantic HTML**: Use proper heading hierarchy

## 10. Responsive Breakpoints

```css
Mobile:  < 640px
Tablet:  640px - 1024px
Desktop: 1024px - 1280px
Wide:    > 1280px
```

### Responsive Strategy
- **Mobile First**: Design for mobile, enhance for larger screens
- **Touch Targets**: 44px minimum for buttons
- **Stack Vertically**: On mobile, switch to grid on tablet+
- **Hide/Show**: Adapt content based on screen size

## 11. Dark Mode

### Light Mode (Default)
- Background: White (#FFFFFF)
- Text: Dark Slate (#0F172A)
- Cards: Slate 50 (#F1F5F9)

### Dark Mode
- Background: Slate 950 (#03030A)
- Text: Slate 100 (#F1F5F9)
- Cards: Slate 800 (#1E293B)
- Surfaces: Slate 900 (#0F172A)

## 12. Implementation Timeline

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Tailwind CSS in Next.js
- [ ] Create CSS variables for design tokens
- [ ] Design and implement base components (Button, Input, Card)
- [ ] Create component documentation

### Phase 2: Complex Components (Week 2-3)
- [ ] Navigation (Top bar, Sidebar, Breadcrumbs)
- [ ] Form components (Select, Checkbox, Radio, Textarea)
- [ ] Modal/Dialog system
- [ ] Toast notification system

### Phase 3: Page Layouts (Week 3-4)
- [ ] Landing page design & implementation
- [ ] Authentication pages (login, register)
- [ ] Dashboard layout system
- [ ] Chat interface design

### Phase 4: Polish & Refinement (Week 4+)
- [ ] Dark mode implementation
- [ ] Animation refinements
- [ ] Accessibility audit
- [ ] Performance optimization

## 13. Design File Organization

```
/design
  ├── figma/
  │   ├── components.fig
  │   ├── pages.fig
  │   └── prototypes.fig
  ├── assets/
  │   ├── logo/
  │   ├── icons/
  │   └── illustrations/
  └── documentation/
      ├── design-system.md
      ├── components.md
      └── patterns.md
```

---

**Design System Version**: 1.0
**Last Updated**: 2026-09-26
**Status**: Active Development
