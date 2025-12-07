# Quick Start Guide

Get your portfolio running in 5 minutes! ⚡

## Step 1: Install Dependencies

Open your terminal in the portfolio directory and run:

```bash
npm install
```

This will install:
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide Icons

## Step 2: Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 3: Customize Your Content

### Must-Change Items:

1. **Your Name** in `app/components/Hero.tsx` (line ~13):
   ```typescript
   const name = "OMAR" // Change to YOUR NAME
   ```

2. **Your Email** in `app/components/Contact.tsx` (line ~20):
   ```typescript
   const email = 'your.email@example.com' // Your real email
   ```

3. **Social Links** - Update in TWO places:
   - `app/components/Navigation.tsx` (lines ~5-10)
   - `app/components/Contact.tsx` (lines ~12-16)

4. **Projects** in `app/components/Projects.tsx` (lines ~7-48):
   - Replace with your actual projects
   - Update titles, descriptions, links

5. **Experience** in `app/components/About.tsx` (lines ~7-35):
   - Add your education
   - Add your work experience

6. **Skills** in `app/components/Skills.tsx` (lines ~7-20):
   - List your actual technologies

## Step 4: Test Everything

- [ ] Check your name displays correctly
- [ ] Verify all sections load
- [ ] Test scroll animations
- [ ] Try the custom cursor (on desktop)
- [ ] Click all social links
- [ ] Resize browser for mobile view
- [ ] Test email copy button

## Step 5: Deploy

When ready to go live:

```bash
npm run build  # Test production build
```

Then deploy to Vercel (easiest):
1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Click Deploy

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

---

## Project Structure

```
portfolio/
├── app/
│   ├── components/       # All UI components
│   │   ├── Hero.tsx      # ⭐ Main intro with your name
│   │   ├── About.tsx     # 📚 Experience & education
│   │   ├── Projects.tsx  # 💼 Your work showcase
│   │   ├── Skills.tsx    # 🛠️ Technologies you use
│   │   ├── Contact.tsx   # 📧 Get in touch section
│   │   ├── Navigation.tsx # Social links sidebar
│   │   └── CursorFollower.tsx # Cool cursor effect
│   ├── layout.tsx        # 🎨 Fonts & metadata
│   ├── page.tsx          # 🏠 Main page (assembles all components)
│   └── globals.css       # 🎨 Global styles & animations
├── public/               # Static files (images, resume, etc.)
├── tailwind.config.ts    # Tailwind configuration
└── package.json          # Dependencies
```

---

## Design Features ✨

- **Dark sketchbook aesthetic** with subtle paper texture
- **Bold yellow accents** (#FFD700) for highlights
- **Custom cursor** that follows your mouse (desktop only)
- **Smooth scroll animations** as you navigate
- **Responsive design** works on all devices
- **Professional typography** with Bebas Neue and Inter

---

## Tips & Tricks

### Adding Images
Place images in `public/` folder:
```
public/
  ├── profile.jpg
  ├── project1.png
  └── resume.pdf
```

Reference in code: `/profile.jpg`

### Changing Colors
Edit `tailwind.config.ts`:
```typescript
accent: {
  yellow: '#FFD700', // Your preferred color
}
```

### Adding More Projects
Copy an existing project object in `Projects.tsx` and modify.

### Testing Mobile View
- Chrome DevTools: F12 → Toggle device toolbar
- Resize browser window
- Test on actual mobile device

---

## Common Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Run production build locally
npm run lint     # Check for code issues
```

---

## Need Help?

1. **Customization:** See [CUSTOMIZATION.md](CUSTOMIZATION.md)
2. **Deployment:** See [DEPLOYMENT.md](DEPLOYMENT.md)
3. **README:** See [README.md](README.md) for full docs

---

## Next Steps

After basic setup:

1. Add your resume PDF to `public/resume.pdf`
2. Add project screenshots/images
3. Write compelling project descriptions
4. Update meta tags for SEO
5. Test on multiple browsers
6. Deploy to production
7. Share with the world! 🚀

---

**Enjoy your new portfolio!** Remember to keep it updated as you build new projects. 

The design is intentionally simple and professional - perfect for showcasing your work without distractions.

