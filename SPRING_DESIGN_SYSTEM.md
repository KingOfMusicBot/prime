# 🌸 CODEWITH-VIVEK: Spring Season UI Design System

## Overview

A premium, modern spring-themed learning platform design system for competitive exam preparation (JEE/NEET). The design emphasizes calm, focus, and motivation while maintaining contemporary aesthetics.

---

## 1. COLOR PALETTE

### Primary Colors
- **Soft Leaf Green**: `#4CAF6A` — Main interaction color, trust, growth
- **Fresh Mint**: `#7ED957` — Energetic accents, success states
- **Light Spring Yellow**: `#F5F9C1` — Subtle highlights, attention

### Secondary Colors
- **Sky Blue**: `#8ED6FF` — Information, clarity, learning
- **Soft Lavender**: `#BFA8FF` — Calm, focus, premium feel
- **Blossom Pink**: `#FFB7D5` — Completion, achievement, praise

### Neutral Colors
- **Cream White**: `#FAFFF7` — Primary background, clean space
- **Soft Sand**: `#F3F5EB` — Secondary background, soft surfaces
- **Deep Forest**: `#1E2A22` — Text, dark mode base, depth

### Accent Colors
- **Butter Yellow**: `#FFD84D` — Important alerts, rewards
- **Petal Pink**: `#FF9ECF` — Celebration, completion feedback

---

## 2. TAILWIND CSS COLOR MAPPING

```
Light Mode
├─ spring-leaf: #4CAF6A (primary green)
├─ spring-mint: #7ED957 (fresh accent)
├─ spring-yellow: #F5F9C1 (subtle highlight)
├─ spring-sky: #8ED6FF (info blue)
├─ spring-lavender: #BFA8FF (premium purple)
├─ spring-pink: #FFB7D5 (blossom pink)
├─ spring-cream: #FAFFF7 (background)
├─ spring-sand: #F3F5EB (secondary bg)
├─ spring-forest: #1E2A22 (dark text)
├─ spring-yellow-accent: #FFD84D (alert)
└─ spring-pink-accent: #FF9ECF (celebration)

Dark Mode
├─ spring-leaf-dark: #6DD477 (glowing green)
├─ spring-mint-dark: #90FF6B (vivid mint)
├─ spring-lavender-dark: #D5C9FF (bright lavender)
├─ spring-pink-dark: #FF8FBE (vibrant pink)
├─ spring-forest-dark: #0F1908 (very dark bg)
└─ spring-forest-surface: #1C2B22 (card bg)
```

---

## 3. BACKGROUND STYLE

### Light Mode Background
**Visual**: Calm spring morning with soft, layered gradients

```css
/* Primary gradient */
background: linear-gradient(
  135deg,
  #FAFFF7 0%,
  #F0FFE8 30%,
  #E8FFF4 60%,
  #F5F9FF 100%
);

/* Radial glow overlays (positioned with pseudo-elements) */
- Soft leaf green glow: top-left, opacity 0.08
- Warm yellow glow: bottom-right, opacity 0.06
- Lavender glow: center-top, opacity 0.05
```

### Dark Mode Background
**Visual**: Spring evening garden with deep forest and glowing accents

```css
/* Primary gradient */
background: linear-gradient(
  135deg,
  #0F1908 0%,
  #1C2B22 40%,
  #1A3A2B 70%,
  #151D1A 100%
);

/* Radial glow overlays */
- Glowing mint: top-left, opacity 0.12
- Lavender glow: bottom-right, opacity 0.08
```

### Texture & Subtle Effects
- **Leaf silhouettes**: Very subtle blurred SVG shapes, opacity 0.03-0.05
- **Floating particles**: CSS-only petal drift animations
- **Soft noise texture**: CSS filter for depth

---

## 4. SPRING-INSPIRED ICONS & ILLUSTRATIONS

### Icon Library Strategy
Use **HeroIcons** or **Feather Icons** base with custom SVG modifications.

### Icon Semantics

| Feature | Icon | Notes |
|---------|------|-------|
| Study/Lectures | 📖 Book with leaf | Metaphor for knowledge growth |
| Batches/Courses | 🌼 Flower cluster | Multiple joined elements |
| Progress | 🌱 Growing plant | Upward growth metaphor |
| Completed | 🌸 Blooming flower | Achievement celebration |
| Enrollment | 🌿 Branch/vine | Connection metaphor |
| Schedule | 📅 Calendar leaf | Time + nature |
| Subject/Topic | 🍃 Single leaf | Focused knowledge |
| Notes | 📝 Leaf notepad | Documentation |

### Illustration Style
- **Stroke-based**: 2-3px weight, rounded joins
- **Color**: Use spring palette only
- **Complexity**: 1-2 layers maximum
- **Emoji guide**: Use as inspiration, not direct replacement

---

## 5. UI COMPONENT STYLING

### 5.1 NAVBAR
**Style**: Spring glass morphism with subtle glow

```css
/* Container */
background: rgba(255, 255, 255, 0.6);
backdrop-filter: blur(14px);
border: 1px solid rgba(0, 0, 0, 0.05);
box-shadow: 0 8px 32px rgba(76, 175, 106, 0.15);
border-radius: 16px;

/* Dark mode */
background: rgba(31, 41, 34, 0.6);
backdrop-filter: blur(14px);
box-shadow: 0 8px 32px rgba(109, 212, 119, 0.1);
```

**Logo**: Include small leaf icon next to "CODEWITH-VIVEK"

**Navigation Links**:
- Hover: `color: #4CAF6A`, `text-shadow: 0 0 8px rgba(76, 175, 106, 0.3)`
- Active: Underline in `#7ED957`, thickness 3px


### 5.2 SIDEBAR
**Style**: Vertical garden panel with leaf indicators

```css
/* Container */
background: linear-gradient(180deg, rgba(76, 175, 106, 0.08) 0%, rgba(126, 217, 87, 0.04) 100%);
border-right: 1px solid rgba(76, 175, 106, 0.1);

/* Dark mode */
background: linear-gradient(180deg, rgba(76, 175, 106, 0.12) 0%, rgba(109, 212, 119, 0.06) 100%);
```

**Active Menu Item**:
```css
background: rgba(76, 175, 106, 0.12);
border-left: 3px solid #4CAF6A;

/* Leaf indicator (::before) */
content: '🍃';
font-size: 12px;
margin-right: 8px;
animation: leafSway 3s ease-in-out infinite;
```

**Hover State**:
```css
background: rgba(76, 175, 106, 0.08);
box-shadow: inset 0 0 12px rgba(76, 175, 106, 0.15);
```

### 5.3 CARDS (Lecture, Batch, Subject)
**Style**: Soft garden tiles with depth

```css
/* Container */
border-radius: 18px;
background: rgba(255, 255, 255, 0.9);
backdrop-filter: blur(10px);
border: 1px solid rgba(76, 175, 106, 0.15);
box-shadow: 0 8px 24px rgba(76, 175, 106, 0.15);
padding: 20px;

/* Dark mode */
background: rgba(28, 43, 34, 0.8);
border: 1px solid rgba(109, 212, 119, 0.2);
box-shadow: 0 8px 24px rgba(76, 175, 106, 0.08);
```

**Hover Effect**:
```css
transform: translateY(-8px);
box-shadow: 0 16px 40px rgba(76, 175, 106, 0.25);
border: 1px solid rgba(76, 175, 106, 0.25);
transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
```

**Badge/Tag** (on cards):
```css
background: linear-gradient(135deg, #7ED957 0%, #4CAF6A 100%);
color: white;
padding: 4px 12px;
border-radius: 12px;
font-size: 12px;
font-weight: 600;
```

### 5.4 BUTTONS

**Primary Button (CTA)**:
```css
/* Container */
border-radius: 16px;
background: linear-gradient(135deg, #7ED957 0%, #4CAF6A 100%);
color: white;
padding: 12px 28px;
font-weight: 600;
border: none;
box-shadow: 0 4px 15px rgba(76, 175, 106, 0.3);

/* Hover */
transform: scale(1.05);
box-shadow: 0 8px 28px rgba(76, 175, 106, 0.4);

/* Active */
transform: scale(0.98);
```

**Secondary Button**:
```css
border-radius: 16px;
background: rgba(76, 175, 106, 0.12);
color: #4CAF6A;
border: 1.5px solid rgba(76, 175, 106, 0.3);
padding: 11px 27px;

/* Hover */
background: rgba(76, 175, 106, 0.18);
border-color: rgba(76, 175, 106, 0.5);
```

**Accent/Success Button**:
```css
background: linear-gradient(135deg, #FFB7D5 0%, #FF9ECF 100%);
color: #1E2A22;
```

**Ghost Button** (light):
```css
background: transparent;
border: 1.5px solid rgba(76, 175, 106, 0.2);
color: #4CAF6A;
```

### 5.5 INPUT FIELDS

```css
/* Container */
border-radius: 14px;
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(8px);
border: 1.5px solid rgba(76, 175, 106, 0.15);
padding: 12px 16px;
font-family: 'Inter', sans-serif;
transition: all 0.3s ease;

/* Focus state */
border: 1.5px solid #4CAF6A;
box-shadow: 0 0 0 3px rgba(76, 175, 106, 0.15);
background: rgba(255, 255, 255, 0.95);

/* Dark mode */
background: rgba(31, 41, 34, 0.6);
border: 1.5px solid rgba(109, 212, 119, 0.2);

/* Dark focus */
border: 1.5px solid #6DD477;
box-shadow: 0 0 0 3px rgba(109, 212, 119, 0.2);
```

**Placeholder Text**:
```css
color: rgba(30, 42, 34, 0.4);
font-weight: 400;
```

### 5.6 PROGRESS BAR (Growth Animation)

```css
/* Container */
border-radius: 12px;
background: rgba(76, 175, 106, 0.1);
height: 8px;
overflow: hidden;

/* Fill */
background: linear-gradient(90deg, #4CAF6A, #7ED957);
animation: growPlant 0.8s ease-out;
border-radius: 12px;
```

### 5.7 BADGES & TAGS

**Success Badge**:
```css
background: rgba(76, 175, 106, 0.15);
color: #4CAF6A;
padding: 6px 12px;
border-radius: 8px;
font-size: 12px;
font-weight: 600;
```

**Alert Badge**:
```css
background: rgba(255, 216, 77, 0.15);
color: #FFD84D;
```

**Premium Badge**:
```css
background: rgba(191, 168, 255, 0.15);
color: #BFA8FF;
```

---

## 6. TYPOGRAPHY

### Font Stack
- **Primary**: `'Poppins', sans-serif` — Headings, interactive elements
- **Secondary**: `'Inter', sans-serif` — Body, description, supporting text

### Type Scale

| Role | Font | Size | Weight | Line Height | Usage |
|------|------|------|--------|-------------|-------|
| H1 | Poppins | 32px | 700 | 1.2 | Page title |
| H2 | Poppins | 24px | 700 | 1.3 | Section title |
| H3 | Poppins | 20px | 600 | 1.4 | Card title |
| Body Large | Inter | 16px | 400 | 1.6 | Main text |
| Body Default | Inter | 14px | 400 | 1.6 | Standard text |
| Caption | Inter | 12px | 500 | 1.5 | Helper text |
| Label | Poppins | 14px | 600 | 1.4 | Input labels, tags |

### Color Hierarchy
- **Primary text**: `#1E2A22` (light), `#F5F5F5` (dark)
- **Secondary text**: `rgba(30, 42, 34, 0.7)` (light), `rgba(245, 245, 245, 0.7)` (dark)
- **Disabled text**: `rgba(30, 42, 34, 0.4)` (light), `rgba(245, 245, 245, 0.4)` (dark)
- **Accent text**: `#4CAF6A` — For links, active states

### Letter Spacing
- Headings: `-0.5px` (tight)
- Body: `0px` (natural)
- Labels: `0.3px` (slightly loose for clarity)

---

## 7. ANIMATIONS

All animations use CSS transforms for optimal performance. No heavy JavaScript animations.

### 7.1 PETAL DRIFT (Background)
```css
@keyframes petalDrift {
  0% {
    transform: translateY(-100px) translateX(0);
    opacity: 0;
  }
  10% {
    opacity: 0.6;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(100vh) translateX(30px);
    opacity: 0;
  }
}
```

**Usage**: Small emoji or SVG petal, infinite loop, duration 8-12s, delay varies

### 7.2 LEAF SWAY (Menu Items)
```css
@keyframes leafSway {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(2deg);
  }
}
```

**Duration**: 3s, ease-in-out, infinite

### 7.3 BLOOM (Completion Feedback)
```css
@keyframes bloom {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
```

**Duration**: 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)

### 7.4 GROW PLANT (Progress Bar Fill)
```css
@keyframes growPlant {
  0% {
    width: 0%;
  }
  100% {
    width: 100%;
  }
}
```

**Duration**: 0.8s ease-out

### 7.5 GLOW PULSE (Interactive Hover)
```css
@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 12px rgba(76, 175, 106, 0.3);
  }
  50% {
    box-shadow: 0 0 24px rgba(76, 175, 106, 0.5);
  }
}
```

**Duration**: 2s ease-in-out, infinite

### 7.6 SCALE UP (Card Hover)
```css
@keyframes scaleUp {
  from {
    transform: translateY(0) scale(1);
  }
  to {
    transform: translateY(-8px) scale(1.02);
  }
}
```

**Duration**: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)

### 7.7 FADE IN (Page Load)
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Duration**: 0.5s ease-out

---

## 8. LIGHT & DARK MODE

### Light Mode (Default)
- **Background**: Spring morning gradient (cream → soft mint)
- **Cards**: White with soft green borders
- **Text**: Deep forest green
- **Accents**: Fresh mint, leaf green
- **Glows**: Soft green and yellow light

### Dark Mode
- **Background**: Spring evening gradient (deep forest → dark green)
- **Cards**: Dark glass (very dark forest with transparency)
- **Text**: Cream white
- **Accents**: Glowing mint, bright lavender
- **Glows**: Firefly-like green and lavender lights

### Mode Switching
Use CSS `prefers-color-scheme` + Tailwind's `dark:` prefix

```html
<!-- In layout.tsx -->
<html className={isDark ? 'dark' : ''}>
```

---

## 9. SPACING & LAYOUT

### Space Scale (Tailwind units)
```
xs: 4px   (0.25rem)
sm: 8px   (0.5rem)
md: 12px  (0.75rem)
lg: 16px  (1rem)
xl: 24px  (1.5rem)
2xl: 32px (2rem)
3xl: 48px (3rem)
```

### Layout Grid
- **Base**: 4px grid
- **Column gutter**: 24px
- **Row gap**: 24px
- **Card padding**: 20px-24px
- **Page padding**: 24px (mobile), 32px (desktop)

---

## 10. COMPONENT INTEGRATION GUIDE

### For Lecture Cards
```tsx
<div className="bg-white/90 backdrop-blur-[10px] rounded-[18px] border border-spring-leaf/15 shadow-[0_8px_24px_rgba(76,175,106,0.15)] hover:shadow-[0_16px_40px_rgba(76,175,106,0.25)] hover:-translate-y-2 transition-all duration-300">
  {/* Content */}
</div>
```

### For Primary Buttons
```tsx
<button className="bg-gradient-to-r from-spring-mint to-spring-leaf text-white rounded-[16px] px-7 py-3 font-semibold shadow-[0_4px_15px_rgba(76,175,106,0.3)] hover:shadow-[0_8px_28px_rgba(76,175,106,0.4)] hover:scale-105 transition-all duration-300">
  Enroll Now
</button>
```

### For Input Fields
```tsx
<input className="rounded-[14px] bg-white/80 backdrop-blur-[8px] border-[1.5px] border-spring-leaf/15 px-4 py-3 focus:border-spring-leaf focus:shadow-[0_0_0_3px_rgba(76,175,106,0.15)] transition-all duration-300" />
```

### For Progress Tracking
```tsx
<div className="h-2 bg-spring-leaf/10 rounded-xl overflow-hidden">
  <div className="h-full bg-gradient-to-r from-spring-leaf to-spring-mint rounded-xl" style={{width: `${percentage}%`}}></div>
</div>
```

---

## 11. IMPLEMENTATION CHECKLIST

- [ ] Update `tailwind.config.ts` with spring color palette
- [ ] Create `spring-theme.css` with animations and base styles
- [ ] Update `app/globals.css` with CSS variables for spring colors
- [ ] Modify navbar component with glass effect
- [ ] Update sidebar with leaf indicators
- [ ] Style lecture cards with garden tile effect
- [ ] Apply button gradients to CTAs
- [ ] Add input field focus states
- [ ] Implement progress bar animations
- [ ] Create petal particle background
- [ ] Test in both light and dark modes
- [ ] Verify animations performance
- [ ] Check text contrast ratios (WCAG AA)
- [ ] Test responsive design (mobile, tablet, desktop)

---

## 12. FILE STRUCTURE

```
project/
├── app/
│   ├── globals.css          (Updated with spring CSS variables)
│   └── layout.tsx           (Dark mode toggle)
├── styles/
│   ├── globals.css          (Secondary, imported by globals)
│   └── spring-theme.css     (NEW: Animations, gradients, effects)
├── tailwind.config.ts       (Updated with spring palette)
├── components/
│   ├── spring/
│   │   ├── SpringCard.tsx       (NEW: Reusable card component)
│   │   ├── SpringButton.tsx     (NEW: Reusable button component)
│   │   └── SpringInput.tsx      (NEW: Reusable input component)
│   ├── navbar/              (Update existing navbar)
│   ├── sidebar/             (Update existing sidebar)
│   └── ...existing components
└── hooks/
    └── useSpringTheme.ts    (NEW: Theme toggle hook)
```

---

## 13. DESIGN TOKENS SUMMARY

| Token | Light Value | Dark Value | Usage |
|-------|-------------|-----------|-------|
| `--spring-leaf` | #4CAF6A | #6DD477 | Primary interactive |
| `--spring-mint` | #7ED957 | #90FF6B | Secondary accent |
| `--spring-yellow` | #F5F9C1 | #FFD84D | Subtle highlight |
| `--spring-sky` | #8ED6FF | #7EBFFF | Info color |
| `--spring-lavender` | #BFA8FF | #D5C9FF | Premium accent |
| `--spring-pink` | #FFB7D5 | #FF8FBE | Feedback color |
| `--glass-bg` | rgba(255,255,255,0.6) | rgba(31,41,34,0.6) | Glass containers |
| `--shadow-sm` | 0 4px 8px rgba(76,175,106,0.1) | 0 4px 8px rgba(76,175,106,0.08) | Subtle depth |
| `--shadow-md` | 0 8px 24px rgba(76,175,106,0.15) | 0 8px 24px rgba(76,175,106,0.08) | Standard depth |
| `--shadow-lg` | 0 16px 40px rgba(76,175,106,0.25) | 0 16px 40px rgba(76,175,106,0.12) | Hover depth |

---

## 14. RESPONSIVE DESIGN

- **Mobile** (< 640px): Full width padding 16px, stack vertically
- **Tablet** (640px - 1024px): 2-column layouts, padding 20px
- **Desktop** (> 1024px): 3+ column layouts, padding 24-32px

All animations remain the same across breakpoints.

---

## 15. ACCESSIBILITY

- ✅ Color contrast: WCAG AA minimum (4.5:1 for text)
- ✅ Focus states: Clearly visible green outline
- ✅ Animations: Respect `prefers-reduced-motion`
- ✅ Semantic HTML: Proper heading hierarchy
- ✅ Alt text: All icons have alt text or aria-label

---

## 16. PERFORMANCE NOTES

- All animations use CSS transforms (GPU-accelerated)
- Particle effects limited to 3-5 max elements at once
- Blur effects use `backdrop-filter` (hardware-supported)
- No heavy JavaScript animation libraries needed
- Images should be lazy-loaded with `next/image`

---

## QUICK START COMMANDS

```bash
# Apply tailwind theme
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Check TypeScript
npx tsc --noEmit
```

---

**Last Updated**: March 2026  
**Version**: 1.0 - Initial Spring Design System  
**Maintainer**: Design System Team
