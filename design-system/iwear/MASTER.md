# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** iWear
**Generated:** 2026-11-23 04:51:26
**Category:** Wardrobe & Outfit Planner
**Token files:** `tokens.json` (W3C Design Tokens Community Group JSON).
**CSS variables:** `tokens.css` (`:root` custom properties).
Token files are master-level only; `--page` overrides do not emit tokens.

---

## Global Rules

### Color Palette

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary | `#BE185D` | `--color-primary` |
| On Primary | `#FFFFFF` | `--color-on-primary` |
| Secondary | `#EC4899` | `--color-secondary` |
| On Secondary | `#000000` | `--color-on-secondary` |
| Accent/CTA | `#D97706` | `--color-accent` |
| On Accent/CTA | `#000000` | `--color-on-accent` |
| Background | `#FDF2F8` | `--color-background` |
| Foreground | `#0F172A` | `--color-foreground` |
| Card | `#FFFFFF` | `--color-card` |
| Card Foreground | `#0F172A` | `--color-card-foreground` |
| Muted | `#FBF1F5` | `--color-muted` |
| Muted Foreground | `#475569` | `--color-muted-foreground` |
| Border | `#F7E3EB` | `--color-border` |
| Destructive | `#DC2626` | `--color-destructive` |
| On Destructive | `#FFFFFF` | `--color-on-destructive` |
| Ring | `#BE185D` | `--color-ring` |

**Color Notes:** Fashion rose + gold accent

### Typography

- **Heading Font:** Outfit
- **Body Font:** Outfit
- **Mood:** bauhaus, geometric, constructivist, bold, uppercase, architectural, mechanical, poster, tactile
- **Google Fonts:** [Outfit + Outfit](https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap)

**CSS Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;700;900&display=swap');
```

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` / `0.25rem` | Tight gaps |
| `--space-sm` | `8px` / `0.5rem` | Icon gaps, inline spacing |
| `--space-md` | `16px` / `1rem` | Standard padding |
| `--space-lg` | `24px` / `1.5rem` | Section padding |
| `--space-xl` | `32px` / `2rem` | Large gaps |
| `--space-2xl` | `48px` / `3rem` | Section margins |
| `--space-3xl` | `64px` / `4rem` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle lift |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards, buttons |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Modals, dropdowns |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.15)` | Hero images, featured cards |

---

## Component Specs

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: #D97706;
  color: #000000;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #BE185D;
  border: 2px solid #BE185D;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease;
  cursor: pointer;
}
```

### Cards

```css
.card {
  background: #FDF2F8;
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
```

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease;
}

.input:focus {
  border-color: #BE185D;
  outline: none;
  box-shadow: 0 0 0 3px #BE185D20;
}
```

### Modals

```css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.modal {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
```

---

## Style Guidelines

**Style:** Minimalism & Swiss Style

**Keywords:** Clean, simple, spacious, functional, white space, high contrast, geometric, sans-serif, grid-based, essential

**Best For:** Enterprise apps, dashboards, documentation sites, SaaS platforms, professional tools

**Key Effects:** Subtle hover (200-250ms), smooth transitions, sharp shadows if any, clear type hierarchy, fast loading

### Page Pattern

**Pattern Name:** Scroll-Triggered Storytelling

- **Conversion Strategy:** Keep the narrative understandable without scroll-driven effects. Use progress indicator. Mobile: simplify animations. Keep DOM reading order complete; disable parallax and scroll-scrub under reduced motion. Pause scroll animation when offscreen or hidden and render each chapter in its final readable state under reduced motion.
- **CTA Placement:** End of each chapter (mini) + Final climax CTA
- **Section Order:** Intro hook > Chapter 1 (problem) > Chapter 2 (journey) > Chapter 3 (solution) > Climax CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Excessive decoration

### Additional Forbidden Patterns

- ❌ **Emojis as icons** — Use SVG icons (Heroicons, Lucide, Simple Icons)
- ❌ **Missing cursor:pointer** — All clickable elements must have cursor:pointer
- ❌ **Layout-shifting hovers** — Avoid scale transforms that shift layout
- ❌ **Low contrast text** — Maintain 4.5:1 minimum contrast ratio
- ❌ **Instant state changes** — Always use transitions (150-300ms)
- ❌ **Invisible focus states** — Focus states must be visible for a11y

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (use SVG instead)
- [ ] All icons from consistent icon set (Heroicons/Lucide)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150-300ms)
- [ ] Light mode: text contrast 4.5:1 minimum
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

---

## iWear 双主题（项目决策，覆盖上面的单一配色）

本项目实现**两套可切换主题**，需求见 `iwear-prd.md` 6.5。CSS 变量名不变，按主题替换值。

### 主题「素雅」（默认）

| Role | Hex | 说明 |
|------|-----|------|
| Primary | `#18181B` | 近黑，按钮和主要文字 |
| On Primary | `#FFFFFF` | |
| Secondary | `#3F3F46` | |
| On Secondary | `#FFFFFF` | |
| Accent/CTA | `#A16207` | 深金，仅用于强调（额度、标签） |
| On Accent/CTA | `#FFFFFF` | |
| Background | `#FAFAF7` | 米白，看衣服颜色最准 |
| Foreground | `#09090B` | |
| Card | `#FFFFFF` | |
| Card Foreground | `#09090B` | |
| Muted | `#F0EFEA` | |
| Muted Foreground | `#52525B` | 对 Muted 的对比度约 6.9:1 |
| Border | `#E4E4E7` | |
| Destructive | `#DC2626` | |
| On Destructive | `#FFFFFF` | |
| Ring | `#18181B` | |
| Image Surface | `#F4F4F5` | 衣物图片底色，中性浅灰 |

### 主题「玫瑰」

使用 MASTER 上半部分的库内配色。补充一个图片底色：`#F4F4F5`（中性浅灰），**不要**用粉底 `#FDF2F8` 铺在衣物图片后面，否则衣服颜色会偏。

### 两套主题的共同规则

- 组件只从 `useTheme()` 取颜色，不写死色值。
- 品牌字「iWear」和数字用 Outfit；中文正文用系统字体。
- 所有文字对背景的对比度 ≥ 4.5:1；大字（≥ 18.66px 粗体或 ≥ 24px）≥ 3:1。
- 主按钮、卡片、分段控件是核心组件，两套主题下都要检查一次。
- 玫瑰主题里的强调色 `#BE185D` 只用在小面积元素（选中态边框、标签、图标），不作大面积背景。

### 组件规格

| 组件 | 规格 |
|------|------|
| 主按钮 | 高 48，圆角 12，主色填充，禁用时 40% 透明度 |
| 次按钮 | 高 48，圆角 12，1px 边框，透明底 |
| 输入框 | 高 48，圆角 12，muted 底，1px 边框；聚焦时 2px ring |
| 分段控件 | 高 40，圆角 10，选中项白底 + 阴影 |
| 衣橱卡片 | 3:4 图片区，圆角 12，下方两行文字 |
| 聊天气泡 | 圆角 16，最大宽度 80%，用户消息主色底白字 |
| 标签 | 高 28，圆角 14，muted 底，12px 字 |
| 页面边距 | 水平 20，区块间距 24 |
| 触控区 | 最小 44×44 |
