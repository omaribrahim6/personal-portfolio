# Project Structure

Complete file structure of your dark portfolio website.

```
portfolio/
│
├── 📁 app/                           # Next.js App Directory
│   ├── 📁 components/                # React Components
│   │   ├── 🎯 Hero.tsx              # Hero section with animated name
│   │   ├── 📚 About.tsx             # Experience & education timeline
│   │   ├── 💼 Projects.tsx          # Project showcase with cards
│   │   ├── 🛠️  Skills.tsx           # Skills & technologies grid
│   │   ├── 📧 Contact.tsx           # Contact section with social links
│   │   ├── 🧭 Navigation.tsx        # Fixed social navigation sidebar
│   │   └── 🖱️  CursorFollower.tsx    # Custom cursor animation
│   │
│   ├── 🎨 globals.css                # Global styles, animations, textures
│   ├── 📄 layout.tsx                 # Root layout with fonts & metadata
│   └── 🏠 page.tsx                   # Main page assembling all sections
│
├── 📁 public/                        # Static Assets
│   └── 🤖 robots.txt                 # SEO robots configuration
│
├── ⚙️  Configuration Files
│   ├── package.json                  # Dependencies & scripts
│   ├── tsconfig.json                 # TypeScript configuration
│   ├── tailwind.config.ts            # Tailwind CSS custom config
│   ├── postcss.config.js             # PostCSS configuration
│   ├── next.config.js                # Next.js configuration
│   ├── .eslintrc.json                # ESLint rules
│   └── .gitignore                    # Git ignore rules
│
└── 📚 Documentation Files
    ├── README.md                     # Main project documentation
    ├── QUICKSTART.md                 # 5-minute setup guide
    ├── CUSTOMIZATION.md              # Detailed customization guide
    ├── DEPLOYMENT.md                 # Deployment instructions
    └── PROJECT-STRUCTURE.md          # This file!
```

---

## Component Breakdown

### 🎯 Hero.tsx
**Purpose:** First impression with bold animated name
- Letter-by-letter name animation
- Bio with yellow highlights
- Scroll indicator
- Mobile-friendly social links

**Key Features:**
- Framer Motion animations
- Responsive typography (7xl to 12rem)
- Interactive letter hover effects

---

### 📚 About.tsx
**Purpose:** Your background and journey
- Education section
- Work experience
- Timeline format

**Key Features:**
- Scroll-triggered animations
- Hover effects on cards
- "//" developer-style headers
- Expandable details

---

### 💼 Projects.tsx
**Purpose:** Showcase your best work
- Project cards with hover effects
- Tech stack tags
- Links to demo and code

**Key Features:**
- Yellow border glow on hover
- Project numbering (00, 01, 02...)
- Staggered fade-in animations
- Responsive grid layout

---

### 🛠️ Skills.tsx
**Purpose:** Display your technical abilities
- Categorized skills (Languages, Frameworks, Tools, Design)
- Grid layout with hover effects

**Key Features:**
- Interactive skill cards
- Scale and lift animations
- Category organization
- Additional info section

---

### 📧 Contact.tsx
**Purpose:** Connect with visitors
- Large "LET'S TALK" CTA
- Email with copy-to-clipboard
- Social media links
- Footer information

**Key Features:**
- One-click email copy
- Animated social icons
- Scale animations on hover

---

### 🧭 Navigation.tsx
**Purpose:** Fixed social media sidebar
- Always visible on desktop
- Links to GitHub, LinkedIn, Email, Resume

**Key Features:**
- Fixed positioning (right side)
- Smooth hover animations
- Hidden on mobile (in Hero instead)

---

### 🖱️ CursorFollower.tsx
**Purpose:** Custom cursor experience
- Yellow glowing cursor dot
- Outer ring that follows
- Expands on hover over links

**Key Features:**
- Spring physics animations
- Only active on desktop
- Blend mode effects
- Smooth tracking

---

## Styling Architecture

### 🎨 globals.css
**Contains:**
- Tailwind imports
- CSS custom properties (variables)
- Sketchbook paper texture overlay
- Grain texture effect
- Custom scrollbar styling
- Selection color styling
- Utility classes (glow effects)
- Animation keyframes

### 🎨 tailwind.config.ts
**Defines:**
- Custom color palette
  - `dark-primary`: #1a1a1a
  - `dark-secondary`: #2a2a2a
  - `accent-yellow`: #FFD700
- Font families (Bebas Neue, Inter)
- Extended spacing
- Custom letter spacing

---

## Data Flow

```
page.tsx (Main Entry)
    │
    ├─→ CursorFollower (Global)
    ├─→ Navigation (Fixed Sidebar)
    │
    └─→ main
        ├─→ Hero
        ├─→ About
        ├─→ Projects
        ├─→ Skills
        └─→ Contact
```

---

## File Sizes (Approximate)

| File | Lines | Purpose |
|------|-------|---------|
| Hero.tsx | 90 | Main introduction |
| About.tsx | 110 | Experience section |
| Projects.tsx | 130 | Project showcase |
| Skills.tsx | 100 | Skills display |
| Contact.tsx | 120 | Contact section |
| Navigation.tsx | 50 | Social sidebar |
| CursorFollower.tsx | 70 | Cursor animation |
| globals.css | 150 | Global styles |
| page.tsx | 20 | Main assembler |

**Total:** ~840 lines of code (excluding configs and docs)

---

## Key Technologies

- **Next.js 14:** React framework with App Router
- **TypeScript:** Type-safe JavaScript
- **Tailwind CSS:** Utility-first CSS framework
- **Framer Motion:** Animation library
- **Lucide Icons:** Icon library
- **Google Fonts:** Bebas Neue & Inter

---

## Animation Features

1. **Hero Name:** Letter-by-letter reveal with spring animation
2. **Scroll Animations:** Fade-in on scroll for all sections
3. **Cursor Follower:** Smooth tracking with spring physics
4. **Hover Effects:** Scale, color, and glow transitions
5. **Parallax:** Subtle background movement (via decorative elements)
6. **Stagger:** Sequential animations for lists and grids

---

## Responsive Breakpoints

- **Mobile:** < 768px (stacked layout, no cursor follower)
- **Tablet:** 768px - 1024px (adjusted typography)
- **Desktop:** > 1024px (full features, cursor follower)

---

## Performance Optimizations

✅ Font loading optimized with `next/font`
✅ Component-level code splitting (automatic)
✅ Scroll animations use `useInView` (only animate when visible)
✅ Cursor follower disabled on mobile
✅ CSS animations use GPU-accelerated properties
✅ Minimal JavaScript bundle
✅ Static generation where possible

---

## Customization Points

**Easy to change:**
- Colors (Tailwind config)
- Fonts (layout.tsx)
- Content (component arrays)
- Social links (Navigation & Contact)

**Medium difficulty:**
- Animation timing (Framer Motion props)
- Layout structure (component JSX)
- Section order (page.tsx)

**Advanced:**
- Add new sections
- Change animation library
- Modify cursor behavior

---

## Browser Support

✅ Chrome/Edge (latest)
✅ Firefox (latest)
✅ Safari (latest)
✅ Mobile browsers

**Note:** Custom cursor is desktop-only by design.

---

## Next Steps

1. ✏️ Customize content (see CUSTOMIZATION.md)
2. 🎨 Adjust colors if desired
3. 📸 Add images and screenshots
4. 🚀 Deploy (see DEPLOYMENT.md)
5. 📊 Add analytics (optional)
6. 🔍 Submit to search engines

---

This structure is designed to be:
- **Easy to navigate** - Clear file organization
- **Easy to customize** - Well-documented components
- **Easy to maintain** - Clean, typed code
- **Easy to deploy** - Standard Next.js setup

Enjoy building your portfolio! 🎉

