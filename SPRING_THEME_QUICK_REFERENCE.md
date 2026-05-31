# Spring Theme — Quick Reference Guide

## Color Palette

### Light Mode
```
Primary Green         #4CAF6A   ▢ spring-leaf
Fresh Mint           #7ED957   ▢ spring-mint
Light Yellow         #F5F9C1   ▢ spring-yellow
Sky Blue             #8ED6FF   ▢ spring-sky
Soft Lavender        #BFA8FF   ▢ spring-lavender
Blossom Pink         #FFB7D5   ▢ spring-pink
Cream White          #FAFFF7   ▢ spring-cream
Soft Sand            #F3F5EB   ▢ spring-sand
Deep Forest          #1E2A22   ▢ spring-forest
Butter Yellow        #FFD84D   ▢ spring-yellow-accent
Petal Pink           #FF9ECF   ▢ spring-pink-accent
```

### Dark Mode
```
Glowing Leaf         #6DD477   ▢ spring-leaf-dark
Vivid Mint           #90FF6B   ▢ spring-mint-dark
Glowing Lavender     #D5C9FF   ▢ spring-lavender-dark
Vibrant Pink         #FF8FBE   ▢ spring-pink-dark
Very Dark BG         #0F1908   ▢ spring-cream-dark
Card Surface         #1C2B22   ▢ spring-sand-dark / spring-forest-surface
Cream Text           #E8F5E9   ▢ spring-forest-dark
```

---

## Component Snippets

### Button - Primary CTA
```tsx
<button className="
  bg-gradient-to-r from-spring-mint to-spring-leaf
  dark:from-spring-mint-dark dark:to-spring-leaf-dark
  text-white px-7 py-3
  rounded-[16px]
  font-bold font-poppins
  shadow-[0_4px_15px_rgba(76,175,106,0.3)]
  hover:shadow-[0_8px_28px_rgba(76,175,106,0.4)]
  hover:scale-105
  transition-all duration-300
">
  Action
</button>
```

**Or use component:**
```tsx
<SpringButton variant="primary">Action</SpringButton>
```

---

### Button - Secondary
```tsx
<button className="
  bg-spring-leaf/12 dark:bg-spring-mint/10
  text-spring-leaf dark:text-spring-mint
  border border-spring-leaf/30 dark:border-spring-mint/20
  px-7 py-3
  rounded-[16px]
  font-bold font-poppins
  hover:bg-spring-leaf/18 dark:hover:bg-spring-mint/15
  transition-all duration-300
">
  Action
</button>
```

**Or use component:**
```tsx
<SpringButton variant="secondary">Action</SpringButton>
```

---

### Card - Base
```tsx
<div className="
  bg-white/90 dark:bg-spring-forest-surface/80
  backdrop-blur-[10px]
  rounded-[18px]
  border border-spring-leaf/15 dark:border-spring-mint/20
  shadow-spring-md dark:shadow-spring-md
  hover:shadow-spring-xl dark:hover:shadow-spring-lg
  hover:-translate-y-2
  transition-all duration-300
">
  {/* Content */}
</div>
```

**Or use component:**
```tsx
<SpringCard>
  {/* Content */}
</SpringCard>
```

---

### Input Field
```tsx
<input className="
  w-full
  rounded-[14px]
  bg-white/80 dark:bg-spring-forest/60
  backdrop-blur-[8px]
  border-[1.5px] border-spring-leaf/15 dark:border-spring-mint/20
  px-4 py-3
  focus:border-spring-leaf dark:focus:border-spring-mint
  focus:shadow-[0_0_0_3px_rgba(76,175,106,0.15)]
  dark:focus:shadow-[0_0_0_3px_rgba(109,212,119,0.2)]
  focus:outline-none
  transition-all duration-300
" />
```

**Or use component:**
```tsx
<SpringInput label="Label" placeholder="Placeholder" />
```

---

### Progress Bar
```tsx
<div className="h-2 bg-spring-leaf/10 dark:bg-spring-mint/10 rounded-xl overflow-hidden">
  <div
    className="h-full bg-gradient-to-r from-spring-leaf to-spring-mint
    dark:from-spring-leaf-dark dark:to-spring-mint-dark"
    style={{ width: `${percentage}%` }}
  />
</div>
```

**Or use component:**
```tsx
<SpringProgress value={75} label="Progress" animated={true} />
```

---

### Badge
```tsx
<span className="
  inline-block px-3 py-1
  rounded-lg
  text-xs font-bold font-poppins
  bg-spring-leaf/15 dark:bg-spring-leaf-dark/15
  text-spring-leaf dark:text-spring-mint
">
  Badge Text
</span>
```

**Or use component:**
```tsx
<SpringBadge variant="success">Badge Text</SpringBadge>
```

---

## Common Patterns

### Full Width Background
```tsx
<div className="
  min-h-screen
  bg-gradient-to-br from-spring-cream via-white to-spring-sand
  dark:from-spring-cream-dark dark:via-spring-sand-dark dark:to-spring-cream-dark
">
  {/* Content */}
</div>
```

---

### Glass Navbar
```tsx
<nav className="
  bg-white/60 dark:bg-spring-forest/60
  backdrop-blur-[14px]
  border-b border-spring-leaf/5 dark:border-spring-mint/10
  shadow-[0_8px_32px_rgba(76,175,106,0.15)]
  dark:shadow-[0_8px_32px_rgba(109,212,119,0.1)]
  sticky top-0 z-50
  rounded-b-2xl
">
  {/* Nav Items */}
</nav>
```

---

### Hover Animation
```tsx
<div className="
  hover:shadow-spring-lg
  hover:-translate-y-2
  hover:scale-102
  transition-all duration-300
">
  {/* Content */}
</div>
```

---

### Animated Icon (Leaf Sway)
```tsx
<span className="
  inline-block
  animate-leaf-sway
  text-2xl
">
  🍃
</span>
```

---

### Bloom Animation (Completion)
```tsx
<button
  onClick={() => markComplete()}
  className="
    animate-bloom
    transition-all
  "
>
  ✓ Mark Complete
</button>
```

---

## Responsive Design

### Mobile-First Approach
```tsx
<div className="
  grid
  grid-cols-1          // Mobile: 1 column
  md:grid-cols-2       // Tablet: 2 columns
  lg:grid-cols-3       // Desktop: 3 columns
  gap-6
">
  {/* Items */}
</div>
```

---

## Typography

### Heading 1
```tsx
<h1 className="
  text-3xl md:text-4xl
  font-bold
  font-poppins
  text-spring-forest dark:text-spring-cream
  leading-tight
">
  Title
</h1>
```

### Heading 2
```tsx
<h2 className="
  text-2xl md:text-3xl
  font-bold
  font-poppins
  text-spring-forest dark:text-spring-cream
">
  Section Title
</h2>
```

### Body Text
```tsx
<p className="
  text-base
  font-inter
  text-spring-forest/70 dark:text-spring-cream/70
  leading-relaxed
">
  Paragraph text...
</p>
```

### Helper Text
```tsx
<span className="
  text-xs md:text-sm
  font-inter
  text-spring-forest/50 dark:text-spring-cream/50
">
  Helper or secondary text
</span>
```

---

## Dialog / Modal

```tsx
<div className="
  fixed inset-0
  bg-black/40 dark:bg-black/60
  backdrop-blur-[2px]
  flex items-center justify-center
  z-50
">
  <div className="
    bg-white/95 dark:bg-spring-forest-surface/90
    backdrop-blur-[10px]
    rounded-2xl
    border border-spring-leaf/15 dark:border-spring-mint/20
    shadow-spring-xl
    p-8
    max-w-md
  ">
    {/* Modal Content */}
  </div>
</div>
```

---

## Utilities Classes

### Text Colors
```
text-spring-leaf           Light mode green text
dark:text-spring-mint      Dark mode mint text
text-spring-sky            Blue text
text-spring-forest/70      70% opacity forest text
dark:text-spring-cream/60  Dark mode cream at 60%
```

### Background Colors
```
bg-spring-cream           Cream background
bg-spring-leaf/12         12% opacity green
bg-gradient-to-r from-spring-leaf to-spring-mint
dark:from-spring-leaf-dark dark:to-spring-mint-dark
```

### Shadows
```
shadow-spring-sm          Subtle elevation
shadow-spring-md          Standard elevation
shadow-spring-lg          Prominent elevation
shadow-spring-xl          Heavy elevation
```

### Borders
```
border border-spring-leaf/15                Light green border
dark:border-spring-mint/20                 Dark green border
rounded-[18px]                             Card corners
rounded-[16px]                             Button corners
rounded-[14px]                             Input corners
```

### Animations
```
animate-petal-drift-1     Falling petal
animate-leaf-sway         Swaying menu item
animate-bloom             Blooming completion
animate-grow-plant        Growing progress
animate-gentle-pulse      Subtle pulse
```

---

## Dark Mode Implementation

### Automatic Detection
```tsx
// In layout.tsx
useEffect(() => {
  const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  if (isDark) document.documentElement.classList.add('dark');
}, []);
```

### Manual Toggle
```tsx
const toggleDarkMode = () => {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('darkMode', isDark ? 'false' : 'true');
};
```

### Use in Components
```tsx
className="text-spring-forest dark:text-spring-cream"
```

---

## Creating New Components

### Template
```tsx
import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export const YourComponent: React.FC<Props> = ({ children, className = '' }) => {
  return (
    <div className={`
      bg-white/90 dark:bg-spring-forest-surface/80
      backdrop-blur-[10px]
      rounded-[18px]
      border border-spring-leaf/15 dark:border-spring-mint/20
      shadow-spring-md
      hover:shadow-spring-lg
      transition-all duration-300
      ${className}
    `}>
      {children}
    </div>
  );
};

export default YourComponent;
```

---

## Common Issues & Solutions

### Spring Colors Not Working?
1. Ensure `tailwind.config.ts` is updated with spring colors
2. Check that `spring-theme.css` is imported
3. Verify CSS variables are in `app/globals.css`

### Dark Mode Not Showing?
1. Add `className="dark"` to `<html>` element
2. Ensure `darkMode: "class"` in tailwind.config
3. Check that dark: classes are in your HTML

### Animations Not Running?
1. Check browser console for errors
2. Ensure `spring-theme.css` is loaded
3. Check `prefers-reduced-motion` setting

---

## Performance Checklist

- ✅ Use Tailwind classes (not inline styles)
- ✅ Lazy load images with Next.js `Image`
- ✅ Use CSS animations (not JS libraries)
- ✅ Minify CSS in production
- ✅ Use only needed CSS variables
- ✅ Test on slow 3G networks

---

## Browser Support

- ✅ Chrome/Edge 88+
- ✅ Firefox 85+
- ✅ Safari 14+
- ✅ Mobile browsers (iOS Safari 14+, Chrome Mobile)

---

**For detailed documentation, see: SPRING_DESIGN_SYSTEM.md**

**For full implementation guide, see: SPRING_THEME_IMPLEMENTATION.md**
