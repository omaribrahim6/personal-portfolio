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
    <section id="contact" className="min-h-screen py-16 md:py-20 px-4 sm:px-6 flex items-center">
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
            className="font-display text-[clamp(3rem,15vw,9rem)] uppercase mb-6 sm:mb-8 hover:text-accent-yellow transition-colors duration-300"
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
            className="mb-12 flex justify-center"
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 bg-dark-secondary px-4 sm:px-8 py-4 rounded-lg border-2 border-dark-tertiary hover:border-accent-yellow transition-all duration-300 group w-full sm:w-auto max-w-sm sm:max-w-none">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-accent-yellow flex-shrink-0" />
                <a
                  href={`mailto:${email}`}
                  className="text-base sm:text-xl md:text-2xl text-light-primary hover:text-accent-yellow transition-colors duration-300 font-medium break-all sm:break-normal"
                >
                  {email}
                </a>
              </div>
              <button
                onClick={copyEmail}
                className="p-2 hover:bg-accent-yellow hover:text-dark-primary rounded transition-all duration-300 flex-shrink-0"
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

