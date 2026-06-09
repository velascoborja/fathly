# Flip7 Design System

## Overview

Flip7 is a retro-playful, teal-coral-gold design system adapted for Fathly's household budget dashboard. It keeps Fathly's budgeting flows intact while borrowing Flip7's tactile game-piece feel: bold teal surfaces, cream inputs, gold CTAs, coral warning energy, rounded controls, colored glows, dashed dividers, and card-like scoring panels.

---

## Colors

- **Primary Teal** (#2BA8A2): Main UI, hero backgrounds, progress bars, selected accents
- **Primary Light** (#3CC4BD): Hover states and lighter accents
- **Primary Dark** (#1E8C86): Deep backgrounds and readable teal text
- **Primary BG** (#E8F6F5): Subtle teal tint for secondary backgrounds
- **Accent Gold** (#FFD23F): CTAs, highlights, active states, positive emphasis
- **Accent Light** (#FFE47A): Soft gold tints
- **Accent Dark** (#E6B800): Gold hover/depth
- **Coral** (#EF6C4A): Warnings, destructive actions, urgent shortfall states
- **Coral Light** (#FF8A6A): Soft coral tints
- **Coral Dark** (#D45233): Coral hover/depth
- **Cream** (#FFF8E7): Input surfaces and warm panels
- **Sky Blue** (#5DADE2): Info states and chart contrast
- **Surface Base** (#EFF8F7): Page background
- **Surface Card** (#FFFFFF): Card backgrounds
- **Success** (#27AE60): Positive states
- **Error** (#E74C3C): Validation errors

## Typography

- **Headline Style**: System font stack, extra-bold (800), generous letter-spacing on major titles
- **Body Font**: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei
- **Display**: 72px extra-bold where space allows
- **h1**: 48px extra-bold
- **h2**: 36px extra-bold
- **h3**: 32px bold
- **body**: 16px medium
- **sm**: 14px medium
- **xs**: 12px medium

---

## Spacing

Base unit: **8px**

- **xs**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 32px
- **2xl**: 48px

## Border Radius

- **sm** (4px): Small tags, inputs
- **md** (8px): Compact controls
- **lg** (16px): Cards, buttons, inputs
- **xl** (24px): Feature cards and scoring items
- **2xl** (32px): Hero cards and modals
- **round** (9999px): Pill buttons, badges, rank badges

## Elevation -- Colored Glow System

- **shadow-sm**: 0 2px 8px black at 8%
- **shadow-md**: 0 4px 16px black at 12%
- **shadow-lg**: 0 8px 32px black at 16%
- **shadow-card**: 0 4px 20px teal at 10%
- **shadow-coral-glow**: 0 4px 20px coral at 35%
- **shadow-teal-glow**: 0 4px 20px teal at 30%
- **shadow-accent-glow**: 0 4px 20px gold at 40%
- **shadow-sky-glow**: 0 4px 16px sky-blue at 30%
- **shadow-focus**: 0 0 0 4px primary at 15%

## Components

### Logo and App Header

The app chrome uses a compact folded-ribbon treatment:

- Cream ribbon background with a dark teal border
- Slight rotation/skew on the app name for retro packaging energy
- Teal/gold icon glow
- Sticky header in a light teal wash

### Buttons

Pill shape (9999px radius), minimum 36px height, bounce transition curve.

#### Primary (Gold CTA)

- Gold gradient background with dark teal text
- Shadow: accent glow
- Active: scale(0.95)

#### Secondary

- Teal fill with white text
- Shadow: teal glow

#### Destructive

- Coral tint or fill depending on context
- Shadow: coral glow on hover/active states

### Cards and Budget Scoring Items

White background, 24px radius, shadow-card, 6px colored left accent bar.

- Default: teal-light left border
- Highlighted: gold left border, warm gold gradient, accent glow
- Warning/shortfall: coral left border, coral-tinted surface
- Data tables live inside the same tactile card system

### Inputs

- Cream background
- 1.5px teal-tinted border
- 16px radius
- Focus ring uses teal at 15%
- Error ring uses coral

### Section Titles

- Icon in a colored circular container
- 3px dashed bottom border where sections need separation
- Bold headline typography with warm, playful spacing

---

## Animations

- **Button bounce**: under 200ms, active scale 0.95
- **Glow pulse**: subtle 2s pulse only for celebratory or key summary states
- **Progress motion**: smooth, short easing
- **Reduced motion**: disable non-essential animation for users who prefer reduced motion

---

## Do's and Don'ts

1. Do use colored glow shadows for interactive elements.
2. Do use pill-shaped buttons consistently.
3. Do use cream (#FFF8E7) for input surfaces.
4. Don't use plain black shadows on interactive elements.
5. Do celebrate budget coverage moments visually with matching brand colors.
6. Do use dashed borders for section dividers.
7. Don't make micro-interaction animations longer than 500ms.
8. Do use left-border color accents on cards for state communication.
9. Do ensure all touch targets are at least 36px on desktop and larger on mobile.
10. Do use the retro folded-ribbon pattern for banner elements.
11. Don't use translucent glass panels when a tactile cream or white surface is clearer.
