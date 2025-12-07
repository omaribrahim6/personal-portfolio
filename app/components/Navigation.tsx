'use client'

import { motion } from 'framer-motion'
import { Github, Linkedin, Mail, FileText } from 'lucide-react'

const socialLinks = [
  { icon: Github, href: 'https://github.com/omaribrahim6', label: 'GitHub' },
  { icon: Linkedin, href: 'http://linkedin.com/in/omar-ibrahim-14825838a', label: 'LinkedIn' },
  { icon: Mail, href: 'mailto:omarmgmi08@gmail.com', label: 'Email' },
  { icon: FileText, href: '/resume.pdf', label: 'Resume' },
]

export default function Navigation() {
  return (
    <motion.nav
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="fixed right-6 top-1/2 -translate-y-1/2 z-50 hidden md:block"
    >
      <ul className="flex flex-col gap-6">
        {socialLinks.map((link, index) => (
          <motion.li
            key={link.label}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + index * 0.1 }}
          >
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 bg-dark-secondary rounded-lg transition-all duration-300 hover:bg-accent-yellow hover:scale-110 group"
              aria-label={link.label}
            >
              <link.icon className="w-5 h-5 text-light-primary transition-colors group-hover:text-dark-primary" />
            </a>
          </motion.li>
        ))}
      </ul>
    </motion.nav>
  )
}

