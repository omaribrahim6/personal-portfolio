# Deployment Guide

This guide covers deploying your portfolio to various platforms.

## Vercel (Recommended) ⚡

Vercel is built by the creators of Next.js and offers the best integration.

### Steps:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/portfolio.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Click "Add New Project"
   - Import your portfolio repository
   - Vercel will auto-detect Next.js
   - Click "Deploy"

3. **Custom Domain (Optional):**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Update DNS records as instructed
   - SSL certificate is automatic

**Build Command:** `npm run build` (auto-detected)
**Output Directory:** `.next` (auto-detected)

---

## Netlify 🌐

### Steps:

1. **Push to GitHub** (see above)

2. **Deploy on Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository

3. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`
   - Make sure to add a `netlify.toml` file:

   ```toml
   [build]
     command = "npm run build"
     publish = ".next"

   [[plugins]]
     package = "@netlify/plugin-nextjs"
   ```

4. **Install Next.js plugin:**
   ```bash
   npm install -D @netlify/plugin-nextjs
   ```

---

## GitHub Pages (Static Export)

Note: Requires converting to static export (some features may not work).

### Steps:

1. **Update `next.config.js`:**
   ```javascript
   /** @type {import('next').NextConfig} */
   const nextConfig = {
     output: 'export',
     images: {
       unoptimized: true,
     },
   }

   module.exports = nextConfig
   ```

2. **Add deploy script to `package.json`:**
   ```json
   "scripts": {
     "deploy": "next build && touch out/.nojekyll && git add out/ && git commit -m 'Deploy' && git subtree push --prefix out origin gh-pages"
   }
   ```

3. **Deploy:**
   ```bash
   npm run deploy
   ```

4. **Configure GitHub Pages:**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `gh-pages` → `/root`

---

## Railway 🚂

### Steps:

1. **Push to GitHub** (see above)

2. **Deploy on Railway:**
   - Go to [railway.app](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository

3. **Settings:**
   - Build command: `npm run build`
   - Start command: `npm start`
   - Add environment variables if needed

---

## DigitalOcean App Platform 🌊

### Steps:

1. **Push to GitHub** (see above)

2. **Create App:**
   - Go to [cloud.digitalocean.com](https://cloud.digitalocean.com)
   - Click "Create" → "Apps"
   - Connect to GitHub and select repository

3. **Configure:**
   - Build Command: `npm run build`
   - Run Command: `npm start`
   - HTTP Port: 3000

---

## Docker Deployment 🐳

If you want to deploy using Docker:

1. **Create `Dockerfile`:**
   ```dockerfile
   FROM node:18-alpine AS base

   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci

   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .
   RUN npm run build

   FROM base AS runner
   WORKDIR /app
   ENV NODE_ENV production
   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs
   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
   USER nextjs
   EXPOSE 3000
   ENV PORT 3000
   CMD ["node", "server.js"]
   ```

2. **Update `next.config.js`:**
   ```javascript
   module.exports = {
     output: 'standalone',
   }
   ```

3. **Build and run:**
   ```bash
   docker build -t portfolio .
   docker run -p 3000:3000 portfolio
   ```

---

## Environment Variables

If you need environment variables:

**Local Development:**
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=your_api_url
```

**Production:**
Add variables in your hosting platform's dashboard.

---

## Custom Domain Setup

### DNS Configuration:

**For Apex Domain (example.com):**
```
A Record: @ → [Your host's IP]
```

**For Subdomain (www.example.com):**
```
CNAME: www → [Your host's domain]
```

**Vercel:**
- Automatic SSL
- Just add domain in dashboard

**Netlify:**
- Automatic SSL
- Add domain in dashboard

---

## Pre-Deployment Checklist

- [ ] Update all placeholder text with your information
- [ ] Test all links work
- [ ] Verify images load correctly
- [ ] Check mobile responsiveness
- [ ] Test on different browsers
- [ ] Update meta tags and SEO information
- [ ] Add Google Analytics (optional)
- [ ] Test contact form/email links
- [ ] Verify social media links
- [ ] Check performance (Lighthouse)
- [ ] Test cursor animation on desktop
- [ ] Verify animations work smoothly

---

## Performance Optimization

Before deploying, ensure optimal performance:

1. **Image Optimization:**
   - Use Next.js Image component
   - Compress images
   - Use WebP format

2. **Code Splitting:**
   - Already handled by Next.js
   - Consider lazy loading heavy components

3. **Font Loading:**
   - Already optimized with `next/font`

4. **Analytics:**
   - Add Google Analytics or Vercel Analytics
   - Monitor Core Web Vitals

---

## Monitoring

After deployment:

1. **Vercel Analytics:** Built-in performance monitoring
2. **Google Search Console:** Monitor SEO and indexing
3. **Google Analytics:** Track visitors
4. **Sentry:** Error tracking (optional)

---

## Troubleshooting

**Build fails:**
- Check for TypeScript errors: `npm run build`
- Verify all dependencies installed: `npm install`
- Clear cache: `rm -rf .next`

**404 errors:**
- Ensure `app/page.tsx` exists
- Check routing configuration

**Images not loading:**
- Verify images in `public` folder
- Check image paths (case-sensitive)

**Animations laggy:**
- Test on different devices
- Consider reducing animation complexity
- Check browser compatibility

---

## Updates & Maintenance

**To update your portfolio:**

1. Make changes locally
2. Test thoroughly: `npm run dev`
3. Commit and push: `git push`
4. Platform auto-deploys (Vercel/Netlify)

**Keep dependencies updated:**
```bash
npm outdated
npm update
```

---

## Cost Considerations

**Free Tiers:**
- Vercel: Free for personal projects
- Netlify: Free for personal projects  
- GitHub Pages: Free
- Railway: Free tier available

**Paid Plans:** Only needed for high traffic or team features.

---

## Support

If you encounter issues:

1. Check platform documentation
2. Review build logs
3. Search community forums
4. Open GitHub issue

Good luck with your deployment! 🚀

