# Dark Portfolio

A dark, minimalist portfolio website with a mysterious sketchbook aesthetic, bold typography, and smooth animations.

## Features

- 🎨 Dark grey sketchbook design with yellow accents
- ✨ Smooth scroll animations and transitions
- 🖱️ Custom cursor follower (desktop only)
- 📱 Fully responsive design
- ⚡ Built with Next.js 14 and TypeScript
- 🎭 Framer Motion animations
- 🎯 SEO optimized

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
\`\`\`bash
git clone <your-repo-url>
cd portfolio
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Run the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Customization

### Personal Information

Update the following files with your information:

- **Hero Section:** `app/components/Hero.tsx` - Change name and bio
- **About Section:** `app/components/About.tsx` - Update experiences and education
- **Projects:** `app/components/Projects.tsx` - Add your projects
- **Skills:** `app/components/Skills.tsx` - List your technologies
- **Contact:** `app/components/Contact.tsx` - Update email and social links
- **Navigation:** `app/components/Navigation.tsx` - Update social media links

### Color Scheme

The color palette is defined in `tailwind.config.ts`:

- **Dark Primary:** #1a1a1a (main background)
- **Dark Secondary:** #2a2a2a (card backgrounds)
- **Accent Yellow:** #FFD700 (highlights and interactions)

### Fonts

Currently using:
- **Display Font:** Bebas Neue (for headers)
- **Body Font:** Inter (for body text)

Change fonts in `app/layout.tsx` if desired.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Deploy with one click

### Other Platforms

Build the production version:
\`\`\`bash
npm run build
npm start
\`\`\`

## Project Structure

\`\`\`
portfolio/
├── app/
│   ├── components/
│   │   ├── Hero.tsx          # Hero section with name animation
│   │   ├── About.tsx         # Experience and education
│   │   ├── Projects.tsx      # Project showcase
│   │   ├── Skills.tsx        # Skills and technologies
│   │   ├── Contact.tsx       # Contact section with footer
│   │   ├── Navigation.tsx    # Fixed social navigation
│   │   └── CursorFollower.tsx # Custom cursor effect
│   ├── layout.tsx            # Root layout with fonts
│   ├── page.tsx              # Main page
│   └── globals.css           # Global styles
├── public/                   # Static assets
├── tailwind.config.ts        # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies
\`\`\`

## Performance

- Optimized fonts using `next/font`
- Smooth animations with Framer Motion
- Responsive images and lazy loading
- Minimal JavaScript bundle

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT License - feel free to use this for your own portfolio!

## Acknowledgments

Design inspired by modern developer portfolios with a focus on simplicity and elegance.

