# Spring Theme Implementation Guide

## Quick Start

### 1. Import Spring Theme Components

```tsx
import { SpringButton, SpringCard, SpringInput, SpringProgress, SpringBadge } from '@/components/spring';
```

### 2. Apply Spring Styles to Existing Components

---

## Component Usage Examples

### NAVBAR STYLING

**File**: `components/navbar.tsx` or `app/components/header.tsx`

```tsx
<nav className="
  bg-white/60 dark:bg-spring-forest/60
  backdrop-blur-[14px]
  border-b border-spring-leaf/5 dark:border-spring-mint/10
  shadow-[0_8px_32px_rgba(76,175,106,0.15)] dark:shadow-[0_8px_32px_rgba(109,212,119,0.1)]
  rounded-b-2xl
  sticky top-0 z-50
">
  {/* Logo with leaf icon */}
  <div className="flex items-center gap-2">
    <span className="text-xl">🍃</span>
    <span className="text-xl font-bold text-spring-leaf dark:text-spring-mint">CODEWITH-VIVEK</span>
  </div>

  {/* Navigation Links */}
  <div className="flex gap-6">
    {navItems.map((item) => (
      <a
        key={item.id}
        href={item.href}
        className="
          text-spring-forest dark:text-spring-cream
          font-medium font-poppins
          hover:text-spring-leaf dark:hover:text-spring-mint
          hover:text-shadow-[0_0_8px_rgba(76,175,106,0.3)]
          relative
          after:absolute after:bottom-0 after:left-0 after:w-0
          after:h-[3px] after:bg-spring-mint
          after:transition-all after:duration-300
          hover:after:w-full
        "
      >
        {item.label}
      </a>
    ))}
  </div>
</nav>
```

---

### SIDEBAR STYLING

**File**: `components/sidebar.tsx`

```tsx
<aside className="
  bg-gradient-to-b from-spring-leaf/8 to-spring-mint/4
  dark:from-spring-leaf/12 dark:to-spring-mint/6
  border-r border-spring-leaf/10 dark:border-spring-mint/15
  backdrop-blur-[8px]
  w-64 min-h-screen
  sticky top-0
">
  {/* Menu Items */}
  {menuItems.map((item) => (
    <div
      key={item.id}
      className={`
        px-4 py-3 rounded-lg mx-2 mb-2
        font-poppins font-medium text-sm
        transition-all duration-300
        ${
          isActive(item.id)
            ? `
              bg-spring-leaf/12 dark:bg-spring-mint/10
              border-l-3 border-spring-leaf dark:border-spring-mint
              text-spring-leaf dark:text-spring-mint
            `
            : `
              text-spring-forest/70 dark:text-spring-cream/70
              hover:bg-spring-leaf/8 dark:hover:bg-spring-mint/8
              hover:shadow-[inset_0_0_12px_rgba(76,175,106,0.15)]
            `
        }
      `}
    >
      <span className="mr-2 animate-leaf-sway">{item.icon}</span>
      {item.label}
    </div>
  ))}
</aside>
```

---

### LECTURE CARDS

**File**: `app/watch/page.tsx` or `components/LectureCard.tsx`

```tsx
import { SpringCard, SpringBadge } from '@/components/spring';

export function LectureCard({ lecture }) {
  return (
    <SpringCard>
      <div className="p-5">
        {/* Thumbnail */}
        <div className="
          relative mb-4 rounded-lg overflow-hidden
          bg-gradient-to-br from-spring-sky/30 to-spring-mint/20
          aspect-video
        ">
          <img
            src={lecture.thumbnail}
            alt={lecture.title}
            className="w-full h-full object-cover"
          />
          <div className="
            absolute inset-0 bg-gradient-to-t from-black/40 to-transparent
            opacity-0 hover:opacity-100 transition-opacity
            flex items-center justify-center
          ">
            <span className="text-4xl">▶️</span>
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-bold text-spring-forest dark:text-spring-cream mb-2 font-poppins">
          {lecture.title}
        </h3>

        <p className="text-sm text-spring-forest/70 dark:text-spring-cream/70 mb-3">
          {lecture.description}
        </p>

        {/* Status Badge */}
        <div className="flex gap-2 mb-4">
          {lecture.isCompleted ? (
            <SpringBadge variant="success">✓ Completed</SpringBadge>
          ) : (
            <SpringBadge variant="info">In Progress</SpringBadge>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="h-1.5 bg-spring-leaf/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-spring-leaf to-spring-mint transition-all"
              style={{ width: `${lecture.progress}%` }}
            />
          </div>
          <p className="text-xs text-spring-forest/60 dark:text-spring-cream/60 mt-1">
            {lecture.progress}% watched
          </p>
        </div>

        {/* CTA Button */}
        <button className="
          w-full
          bg-gradient-to-r from-spring-mint to-spring-leaf
          dark:from-spring-mint-dark dark:to-spring-leaf-dark
          text-white
          py-2.5 rounded-[12px]
          font-semibold font-poppins text-sm
          hover:shadow-[0_8px_24px_rgba(76,175,106,0.3)]
          hover:scale-[1.02]
          transition-all duration-300
        ">
          Continue Lecture
        </button>
      </div>
    </SpringCard>
  );
}
```

---

### BATCH ENROLLMENT CARD

**File**: `components/BatchCard.tsx`

```tsx
import { SpringCard, SpringButton, SpringBadge } from '@/components/spring';

export function BatchCard({ batch }) {
  return (
    <SpringCard>
      <div className="p-6">
        {/* Header with Icon */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">🌼</span>
            <div>
              <h3 className="text-xl font-bold text-spring-forest dark:text-spring-cream font-poppins">
                {batch.name}
              </h3>
              <p className="text-sm text-spring-forest/60 dark:text-spring-cream/60">
                {batch.startDate}
              </p>
            </div>
          </div>
          <SpringBadge variant="premium">{batch.level}</SpringBadge>
        </div>

        {/* Description */}
        <p className="text-sm text-spring-forest/70 dark:text-spring-cream/70 mb-4">
          {batch.description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-spring-leaf/8 dark:bg-spring-leaf/10 rounded-lg p-2 text-center">
            <p className="text-xs text-spring-forest/60 dark:text-spring-cream/60">Lectures</p>
            <p className="font-bold text-spring-leaf dark:text-spring-mint">{batch.lectureCount}</p>
          </div>
          <div className="bg-spring-sky/8 dark:bg-spring-sky/10 rounded-lg p-2 text-center">
            <p className="text-xs text-spring-forest/60 dark:text-spring-cream/60">Students</p>
            <p className="font-bold text-spring-sky dark:text-spring-sky-dark">{batch.students}</p>
          </div>
          <div className="bg-spring-mint/8 dark:bg-spring-mint/10 rounded-lg p-2 text-center">
            <p className="text-xs text-spring-forest/60 dark:text-spring-cream/60">Rating</p>
            <p className="font-bold text-spring-mint dark:text-spring-mint-dark">
              {batch.rating}⭐
            </p>
          </div>
        </div>

        {/* Enrollment Button */}
        <SpringButton
          variant={batch.isEnrolled ? 'secondary' : 'primary'}
          className="w-full"
        >
          {batch.isEnrolled ? '✓ Enrolled' : '+ Enroll Now'}
        </SpringButton>
      </div>
    </SpringCard>
  );
}
```

---

### SUBJECT GRID

**File**: `app/study/page.tsx`

```tsx
<div className="
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
  p-6
">
  {subjects.map((subject) => (
    <SpringCard key={subject.id} hover={true}>
      <div className="p-6 flex flex-col h-full">
        {/* Icon & Title */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">{subject.icon}</span>
          <h3 className="text-lg font-bold text-spring-forest dark:text-spring-cream font-poppins flex-1">
            {subject.name}
          </h3>
        </div>

        {/* Topics Count */}
        <p className="text-sm text-spring-forest/60 dark:text-spring-cream/60 mb-4">
          {subject.topicCount} Topics
        </p>

        {/* Progress Indicator */}
        <div className="mb-4 flex-1">
          <div className="h-2 bg-spring-leaf/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-spring-leaf to-spring-mint transition-all"
              style={{ width: `${subject.progress}%` }}
            />
          </div>
          <p className="text-xs text-spring-forest/60 dark:text-spring-cream/60 mt-2">
            {subject.progress}% Complete
          </p>
        </div>

        {/* CTA Link */}
        <a
          href={`/study/${subject.id}`}
          className="
            text-center px-4 py-2.5
            bg-spring-leaf/12 dark:bg-spring-mint/10
            text-spring-leaf dark:text-spring-mint
            border border-spring-leaf/30 dark:border-spring-mint/20
            rounded-[12px]
            font-semibold text-sm font-poppins
            hover:bg-spring-leaf/18 dark:hover:bg-spring-mint/15
            transition-all duration-300
          "
        >
          Open Subject
        </a>
      </div>
    </SpringCard>
  ))}
</div>
```

---

### VIDEO PLAYER CONTAINER

**File**: `components/VideoComponent.tsx` or `app/watch/page.tsx`

```tsx
<div className="
  max-w-6xl mx-auto p-6
  spring-bg-gradient
  min-h-screen
">
  {/* Player Container */}
  <div className="
    bg-spring-forest/95 dark:bg-black/80
    rounded-2xl
    overflow-hidden
    border border-spring-leaf/10 dark:border-spring-mint/10
    shadow-spring-xl
    mb-6
  ">
    {/* Video iframe or HLS Player */}
    <div className="aspect-video bg-black flex items-center justify-center">
      {/* Your video player component */}
    </div>
  </div>

  {/* Lecture Info Panel */}
  <div className="
    bg-white/90 dark:bg-spring-forest-surface/80
    backdrop-blur-[10px]
    rounded-2xl
    border border-spring-leaf/15 dark:border-spring-mint/20
    shadow-spring-lg
    p-6
  ">
    <div className="mb-6">
      <h2 className="text-2xl font-bold text-spring-forest dark:text-spring-cream mb-2 font-poppins">
        {lecture.title}
      </h2>
      <p className="text-spring-forest/70 dark:text-spring-cream/70">
        {lecture.description}
      </p>
    </div>

    {/* Control Buttons */}
    <div className="flex gap-3 mb-6">
      <SpringButton variant="primary">⬇️ Download Notes</SpringButton>
      <SpringButton variant="secondary">📝 View Transcript</SpringButton>
      <SpringButton variant="accent">🎁 Share</SpringButton>
    </div>

    {/* Completion Marker */}
    {!lecture.isCompleted && (
      <button className="
        w-full
        py-3
        bg-gradient-to-r from-spring-pink to-spring-pink-accent
        dark:from-spring-pink-dark dark:to-spring-pink-accent
        text-spring-forest dark:text-spring-cream
        font-bold font-poppins
        rounded-[16px]
        hover:shadow-[0_8px_24px_rgba(255,183,213,0.3)]
        hover:scale-[1.02]
        transition-all duration-300
        flex items-center justify-center gap-2
      ">
        <span className="animate-bloom">✓</span>
        Mark as Completed
      </button>
    )}
  </div>
</div>
```

---

### PROGRESS TRACKING DASHBOARD

**File**: `app/admin/dashboard/page.tsx` or dashboard component

```tsx
import { SpringCard, SpringProgress, SpringBadge } from '@/components/spring';

export function ProgressDashboard() {
  return (
    <div className="
      grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
      p-6 spring-bg-gradient
    ">
      {/* Overall Progress Card */}
      <SpringCard>
        <div className="p-6">
          <h3 className="text-lg font-bold text-spring-forest dark:text-spring-cream mb-4 font-poppins">
            Overall Progress
          </h3>
          <SpringProgress
            value={72}
            label="Overall Completion"
            animated={true}
          />
          <p className="text-sm text-spring-forest/60 dark:text-spring-cream/60 mt-4">
            Total: 25 of 35 lectures completed
          </p>
        </div>
      </SpringCard>

      {/* Subject Progress Cards */}
      {subjects.map((subject) => (
        <SpringCard key={subject.id}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">{subject.icon}</span>
              <h3 className="text-lg font-bold text-spring-forest dark:text-spring-cream font-poppins">
                {subject.name}
              </h3>
            </div>
            <SpringProgress
              value={subject.progress}
              label="Progress"
              animated={true}
            />
            <div className="flex gap-2 mt-4">
              <SpringBadge variant="success">{subject.completed} done</SpringBadge>
              <SpringBadge variant="info">{subject.remaining} left</SpringBadge>
            </div>
          </div>
        </SpringCard>
      ))}
    </div>
  );
}
```

---

### LOGIN / FORM PAGES

**File**: `app/auth/login.tsx`

```tsx
import { SpringInput, SpringButton } from '@/components/spring';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <div className="
      min-h-screen
      spring-bg-gradient
      flex items-center justify-center
      p-4
    ">
      <div className="
        bg-white/90 dark:bg-spring-forest-surface/80
        backdrop-blur-[10px]
        rounded-2xl
        border border-spring-leaf/15 dark:border-spring-mint/20
        shadow-spring-xl
        w-full max-w-md
        p-8
      ">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-spring-leaf dark:text-spring-mint mb-2 font-poppins">
            🌱 CODEWITH-VIVEK
          </h1>
          <p className="text-spring-forest/70 dark:text-spring-cream/70">
            Welcome back, learner!
          </p>
        </div>

        {/* Form */}
        <form className="space-y-4">
          <SpringInput
            label="Email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            helperText="We'll never share your email"
          />

          <SpringInput
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <SpringButton variant="primary" type="submit" className="w-full">
            Sign In
          </SpringButton>

          <SpringButton variant="ghost" type="button" className="w-full">
            Sign Up Instead
          </SpringButton>
        </form>
      </div>
    </div>
  );
}
```

---

## Tailwind Class Utilities

### Text Colors
```tsx
// Light Mode
text-spring-leaf          // Primary green
text-spring-mint          // Fresh mint
text-spring-sky           // Info blue
text-spring-lavender      // Premium purple
text-spring-pink          // Blossom pink
text-spring-forest        // Dark text

// Dark Mode
dark:text-spring-leaf-dark
dark:text-spring-mint-dark
dark:text-spring-cream
```

### Background Colors
```tsx
// Light Mode
bg-spring-cream           // Main background
bg-spring-sand            // Secondary background
bg-spring-leaf/12         // Soft green overlay (12% opacity)
bg-spring-mint/8          // Soft mint

// Dark Mode
dark:bg-spring-forest-dark
dark:bg-spring-forest-surface
```

### Shadows
```tsx
shadow-spring-sm          // Subtle shadow
shadow-spring-md          // Standard shadow
shadow-spring-lg          // Prominent shadow
shadow-spring-xl          // Heavy shadow
```

### Gradients
```tsx
// Use CSS gradients with color variables
bg-gradient-to-r from-spring-leaf to-spring-mint
dark:from-spring-leaf-dark dark:to-spring-mint-dark
```

### Animations
```tsx
// Built-in Spring Animations
animate-petal-drift-1     // Floating petal
animate-leaf-sway         // Menu sway
animate-bloom             // Completion bloom
animate-grow-plant        // Progress growth
animate-glow-pulse        // Glow effect
animate-gentle-pulse      // Subtle pulse
```

---

## Installation & Setup

### 1. Import Spring Theme CSS (Already configured)

The spring theme CSS is automatically imported in:
- `styles/globals.css` → imports `spring-theme.css`
- `app/globals.css` → includes spring CSS variables

### 2. Use Tailwind Classes

All spring colors are available in Tailwind as custom colors:

```tsx
className="bg-spring-leaf text-spring-cream"
```

### 3. Use React Components

```tsx
import { SpringButton, SpringCard } from '@/components/spring';

export function Example() {
  return (
    <SpringCard>
      <SpringButton variant="primary">Click Me</SpringButton>
    </SpringCard>
  );
}
```

---

## Dark Mode Implementation

Dark mode is automatically handled by Tailwind's `dark:` prefix.

### Enable Dark Mode in Layout

**File**: `app/layout.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check system preference or localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    setIsDark(darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDark;
    setIsDark(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <button onClick={toggleDarkMode} className="fixed bottom-4 right-4">
          {isDark ? '☀️ Light' : '🌙 Dark'}
        </button>
      </body>
    </html>
  );
}
```

---

## Performance Tips

1. **Use CSS Classes Instead of Inline Styles**
   ```tsx
   // ✅ Good
   className="bg-spring-leaf hover:shadow-spring-lg"

   // ❌ Avoid
   style={{ backgroundColor: '#4CAF6A' }}
   ```

2. **Lazy Load Images**
   ```tsx
   import Image from 'next/image';

   <Image
     src={src}
     alt={alt}
     loading="lazy"
     placeholder="blur"
   />
   ```

3. **Use CSS Animations Instead of JS**
   - All spring animations are CSS-only for better performance
   - Respect `prefers-reduced-motion` (built into spring-theme.css)

4. **Optimize Colors with CSS Variables**
   - Spring colors use CSS custom properties for easy switching
   - Reduces bundle size compared to hard-coded colors

---

## Accessibility Checklist

- ✅ Use semantic HTML
- ✅ Ensure 4.5+ contrast ratio for text
- ✅ Test focus states with keyboard navigation
- ✅ Provide alt text for images
- ✅ Use ARIA labels for icons
- ✅ Respect `prefers-reduced-motion`
- ✅ Test with screen readers

---

## File Reference

| File | Purpose |
|------|---------|
| `SPRING_DESIGN_SYSTEM.md` | Complete design system documentation |
| `styles/spring-theme.css` | CSS animations and utility classes |
| `tailwind.config.ts` | Spring color palette & animations |
| `app/globals.css` | CSS variables for spring colors |
| `components/spring/SpringButton.tsx` | Reusable button component |
| `components/spring/SpringCard.tsx` | Reusable card component |
| `components/spring/SpringInput.tsx` | Reusable input component |
| `components/spring/SpringProgress.tsx` | Reusable progress component |
| `components/spring/SpringBadge.tsx` | Reusable badge component |
| `components/spring/index.ts` | Barrel export for spring components |

---

## Need Help?

Refer to:
1. **SPRING_DESIGN_SYSTEM.md** — Complete design specifications
2. **Component files** — See actual implementation examples
3. **Tailwind docs** — For custom class combinations
4. **CSS files** — For animation details

---

**Last Updated**: March 2026  
**Version**: 1.0
