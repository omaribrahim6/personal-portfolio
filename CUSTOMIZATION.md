# Customization Guide

This guide will help you personalize your portfolio with your own information.

## Quick Start Checklist

- [ ] Update your name in Hero section
- [ ] Add your bio and description
- [ ] Update education and work experience
- [ ] Add your projects
- [ ] List your skills and technologies
- [ ] Update contact information and social links
- [ ] Replace placeholder URLs
- [ ] Update metadata for SEO

## Detailed Customization

### 1. Hero Section (`app/components/Hero.tsx`)

**Your Name:**
```typescript
const name = "OMAR" // Change to your name (will be animated letter by letter)
```

**Bio Text:**
```typescript
<p className="text-xl md:text-2xl lg:text-3xl text-light-primary font-body leading-relaxed">
  A <span className="text-accent-yellow font-semibold">developer</span> who creates{' '}
  <span className="text-accent-yellow font-semibold">mysterious</span> and{' '}
  <span className="text-accent-yellow font-semibold">elegant</span> digital experiences.
</p>
```
Update this to describe yourself!

**Tagline:**
```typescript
<p className="text-lg md:text-xl text-light-secondary mt-4">
  Building the web, one bold line at a time.
</p>
```

### 2. About Section (`app/components/About.tsx`)

Update the `experiences` array with your education and work history:

```typescript
const experiences = [
  {
    category: 'education',
    title: 'Your Degree',
    organization: 'Your University',
    period: 'graduated 20XX',
    details: [
      'Your achievements',
      'Your GPA or honors',
      'Relevant coursework',
    ],
  },
  {
    category: 'experience',
    title: 'Your Job Title',
    organization: 'Company Name',
    period: 'month year - present',
    details: [
      'What you did',
      'Technologies you used',
      'Impact you made',
    ],
  },
]
```

### 3. Projects Section (`app/components/Projects.tsx`)

Replace the `projects` array with your actual projects:

```typescript
const projects = [
  {
    number: '00', // Keep sequential numbering
    title: 'Your Project Name',
    description: 'Brief description of what the project does',
    tags: ['React', 'TypeScript', 'etc'], // Technologies used
    github: 'https://github.com/yourusername/project',
    demo: 'https://your-project.com',
  },
  // Add more projects...
]
```

### 4. Skills Section (`app/components/Skills.tsx`)

Update `skillCategories` with your actual skills:

```typescript
const skillCategories = [
  {
    title: 'Languages',
    skills: ['JavaScript', 'Python', 'etc'],
  },
  {
    title: 'Frameworks & Libraries',
    skills: ['React', 'Vue.js', 'etc'],
  },
  // Add or remove categories as needed
]
```

### 5. Contact Section (`app/components/Contact.tsx`)

**Email:**
```typescript
const email = 'your.email@example.com' // Your actual email
```

**Social Links:**
```typescript
const socialLinks = [
  { icon: Github, href: 'https://github.com/yourusername', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/in/yourusername', label: 'LinkedIn' },
  { icon: Twitter, href: 'https://twitter.com/yourusername', label: 'Twitter' },
]
```

**Footer Text:**
```typescript
Designed & Built by <span className="text-accent-yellow font-semibold">Omar</span>
// Change "Omar" to your name
```

### 6. Navigation (`app/components/Navigation.tsx`)

Update the social links in the fixed navigation:

```typescript
const socialLinks = [
  { icon: Github, href: 'https://github.com/yourusername', label: 'GitHub' },
  { icon: Linkedin, href: 'https://linkedin.com/in/yourusername', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:your.email@example.com', label: 'Email' },
  { icon: FileText, href: '/resume.pdf', label: 'Resume' }, // Place resume.pdf in public folder
]
```

### 7. SEO & Metadata (`app/layout.tsx`)

Update the metadata:

```typescript
export const metadata: Metadata = {
  title: 'Your Name - Developer Portfolio',
  description: 'Your personalized description',
  keywords: ['developer', 'portfolio', 'your', 'keywords'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'Your Name - Developer Portfolio',
    description: 'Your personalized description',
    type: 'website',
  },
}
```

### 8. Robots & Sitemap (`public/robots.txt`)

Update your domain:
```
Sitemap: https://yourdomain.com/sitemap.xml
```

## Color Customization

If you want to change the yellow accent color:

**In `tailwind.config.ts`:**
```typescript
accent: {
  yellow: '#FFD700', // Change this hex code
  'yellow-dark': '#FFC700', // And this one (slightly darker)
},
```

**In `app/globals.css`:**
```css
--accent-yellow: #FFD700; /* Change this too */
```

## Font Customization

To use different fonts, update `app/layout.tsx`:

```typescript
import { Inter, Bebas_Neue } from 'next/font/google'
// Replace with your preferred Google Fonts

// Or use custom fonts by placing them in public/fonts/
```

## Adding Your Resume

1. Place your resume PDF in the `public` folder as `resume.pdf`
2. It will be accessible at `/resume.pdf`
3. The navigation and contact links will automatically work

## Testing Your Changes

After making changes:

1. Save all files
2. The dev server will auto-reload
3. Check all sections look correct
4. Test on mobile view (resize browser)
5. Test all links work
6. Verify cursor animation (on desktop)

## Pro Tips

- Keep descriptions concise and impactful
- Use action verbs in your experience descriptions
- Showcase 3-6 of your best projects
- Update regularly as you build new things
- Make sure all external links open in new tabs (already configured)
- Test your site on multiple devices before deploying

## Need Help?

If you encounter issues:
1. Check the browser console for errors
2. Verify all imports are correct
3. Make sure you saved all files
4. Try clearing Next.js cache: `rm -rf .next`
5. Reinstall dependencies: `rm -rf node_modules && npm install`

