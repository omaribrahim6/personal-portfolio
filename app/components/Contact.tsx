'use client'

import { motion } from 'framer-motion'
import { useInView } from 'framer-motion'
import { useRef, useState } from 'react'
import { Mail, Github, Linkedin, FileText, Copy, Check } from 'lucide-react'

const socialLinks = [
  { icon: Github, href: 'https://github.com/omaribrahim6', label: 'GitHub' },
  { icon: Linkedin, href: 'http://linkedin.com/in/omar-ibrahim-14825838a', label: 'LinkedIn' },
  { icon: FileText, href: '/resume.pdf', label: 'Resume' },
]

export default function Contact() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [copied, setCopied] = useState(false)

  const email = 'omarmgmi08@gmail.com'

  const copyEmail = () => {
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section id="contact" className="min-h-screen py-20 px-6 flex items-center">
      <div className="max-w-6xl mx-auto w-full">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Main CTA */}
          <motion.h2
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="font-display text-6xl md:text-7xl lg:text-8xl xl:text-9xl uppercase mb-8 hover:text-accent-yellow transition-colors duration-300"
          >
            LET&apos;S TALK
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="text-xl md:text-2xl text-light-secondary mb-12 max-w-2xl mx-auto"
          >
            Have a project in mind or just want to chat? 
            <span className="text-accent-yellow"> I&apos;d love to hear from you.</span>
          </motion.p>

          {/* Email with copy button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mb-12"
          >
            <div className="inline-flex items-center gap-4 bg-dark-secondary px-8 py-4 rounded-lg border-2 border-dark-tertiary hover:border-accent-yellow transition-all duration-300 group">
              <Mail className="w-6 h-6 text-accent-yellow" />
              <a
                href={`mailto:${email}`}
                className="text-xl md:text-2xl text-light-primary hover:text-accent-yellow transition-colors duration-300 font-medium"
              >
                {email}
              </a>
              <button
                onClick={copyEmail}
                className="p-2 hover:bg-accent-yellow hover:text-dark-primary rounded transition-all duration-300"
                aria-label="Copy email"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </motion.div>

          {/* Social links */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="flex justify-center gap-6 mb-16"
          >
            {socialLinks.map((link, index) => (
              <motion.a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ delay: 0.9 + index * 0.1, duration: 0.6 }}
                whileHover={{ scale: 1.1, y: -5 }}
                className="p-4 bg-dark-secondary rounded-lg border border-dark-tertiary hover:border-accent-yellow hover:bg-accent-yellow transition-all duration-300 group"
                aria-label={link.label}
              >
                <link.icon className="w-6 h-6 text-light-primary group-hover:text-dark-primary transition-colors duration-300" />
              </motion.a>
            ))}
          </motion.div>

          {/* Footer */}
          <motion.footer
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.2, duration: 0.6 }}
            className="pt-12 border-t border-dark-tertiary"
          >
            <p className="text-light-secondary text-sm">
              Designed & Built by <span className="text-accent-yellow font-semibold">Omar</span>
            </p>
            <p className="text-light-secondary text-xs mt-2">
              © {new Date().getFullYear()} All rights reserved.
            </p>
          </motion.footer>
        </motion.div>
      </div>
    </section>
  )
}

