import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TouchNav, type NavAction } from '../../../shared/ui/tui';

interface AboutAppProps {
  onBack: () => void;
}

// ASCII art banner header - no border, scales down on mobile
const BANNER_HEADER = `
  ██████╗ ██╗   ██╗██╗    ██╗   ██╗██╗███╗   ██╗ ██████╗██╗████████╗
 ██╔═══██╗██║   ██║██║    ██║   ██║██║████╗  ██║██╔════╝██║╚══██╔══╝
 ██║   ██║██║   ██║██║    ██║   ██║██║██╔██╗ ██║██║     ██║   ██║
 ██║▄▄ ██║██║   ██║██║    ╚██╗ ██╔╝██║██║╚██╗██║██║     ██║   ██║
 ╚██████╔╝╚██████╔╝██║     ╚████╔╝ ██║██║ ╚████║╚██████╗██║   ██║
  ╚══▀▀═╝  ╚═════╝ ╚═╝      ╚═══╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝   ╚═╝
`;

// Banner footer text - larger on mobile
const BANNER_FOOTER = `"Qui vincit, vincit amore"
He who conquers, conquers by love`;

// Professional journey ASCII timeline - compact for mobile
const JOURNEY_TIMELINE = `┌───────────────────────────────────────────┐
│         PROFESSIONAL JOURNEY              │
├───────────────────────────────────────────┤
│                                           │
│  2021+ ─► IT/OT Specialist                │
│          Municipal Utilities              │
│                    │                      │
│  2014  ─► Internet Technician             │
│          ISP Services                     │
│                    │                      │
│  2013  ─► Regulatory Compliance Tech      │
│          Fuel Systems Service             │
│                    │                      │
│  2012  ─► Construction Specialist         │
│          Various Projects                 │
│                    │                      │
│  2009  ─► Heavy Equipment Operator        │
│          Rock Quarry Operations           │
│                    │                      │
│  2005+ ─► Agricultural Operations         │
│          Family Farm                      │
│                                           │
└───────────────────────────────────────────┘`;

/**
 * About TUI Application
 * Displays information in a terminal-style format
 * Touch-friendly navigation for mobile users
 */
const AboutApp: React.FC<AboutAppProps> = ({ onBack }) => {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'q') {
        e.preventDefault();
        onBack();
      }
    },
    [onBack],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const skills = [
    { category: 'Network Engineering', items: ['Fiber Optics (CFOT)', 'SCADA Networks', 'Wireless', 'IT/OT Integration'] },
    { category: 'Linux & DevOps', items: ['Ubuntu/Debian/RHEL', 'Docker', 'Nginx', 'CI/CD Pipelines', 'Bash'] },
    { category: 'System Admin', items: ['Active Directory', 'Azure AD', 'Windows Server', 'VMware', 'PowerShell'] },
    { category: 'Cybersecurity', items: ['EDR/XDR', 'Security Onion', 'OT/ICS Security', 'SIEM'] },
    { category: 'AI Integration', items: ['Anthropic/Claude', 'xAI/Grok', 'Google Gemini', 'Ollama', 'RAG Systems'] },
    { category: 'Development', items: ['TypeScript', 'React', 'Next.js', 'Python', 'Node.js'] },
    { category: 'Databases', items: ['PostgreSQL', 'SQL Server', 'TimescaleDB', 'SQLite', 'ChromaDB'] },
    { category: 'Infrastructure', items: ['PLC Programming', 'Industrial Control', 'VMware HA Clusters', 'Automation'] },
  ];

  const contacts = [
    { label: 'Email', value: 'vincit_amore@amore.build', href: 'mailto:vincit_amore@amore.build' },
    { label: 'GitHub', value: 'github.com/vincitamore', href: 'https://github.com/vincitamore' },
    { label: 'X', value: '@vincit_amore', href: 'https://x.com/vincit_amore' },
    { label: 'Website', value: 'amore.build', href: 'https://amore.build' },
  ];

  const navActions: NavAction[] = [
    { key: 'q', label: 'Back', onClick: onBack },
  ];

  return (
    <div className="h-full flex flex-col" style={{ color: 'var(--term-foreground)' }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b shrink-0"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span style={{ color: 'var(--term-primary)' }}>ABOUT</span>
        <span className="hidden sm:block text-sm" style={{ color: 'var(--term-muted)' }}>[q] back</span>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-8 px-2">
          {/* ASCII Art Header - scales down on mobile, no scrollbar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center overflow-hidden"
            style={{ background: 'transparent' }}
          >
            {/* ASCII Art - tight line height */}
            <div
              className="text-[6px] sm:text-[8px] md:text-[10px] lg:text-xs whitespace-pre font-mono"
              style={{ color: 'var(--term-primary)', lineHeight: 0.9 }}
            >
              {BANNER_HEADER}
            </div>
            {/* Motto text - larger and more readable */}
            <div
              className="text-[10px] sm:text-xs md:text-sm lg:text-base text-center mt-2 font-mono"
              style={{ color: 'var(--term-primary)' }}
            >
              {BANNER_FOOTER.split('\n').map((line, i) => (
                <div key={i} className={i === 0 ? 'italic' : 'text-[9px] sm:text-[11px] md:text-xs lg:text-sm'} style={i === 1 ? { color: 'var(--term-muted)' } : {}}>
                  {line}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bio Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ color: 'var(--term-primary)' }}
            >
              <span style={{ color: 'var(--term-muted)' }}>[</span>
              BIO
              <span style={{ color: 'var(--term-muted)' }}>]</span>
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4" style={{ color: 'var(--term-foreground)' }}>
              <p className="italic" style={{ color: 'var(--term-secondary)' }}>
                Building things that work and that last.
              </p>
              <p>
                I grew up on a farm, which means I learned early that when something breaks, 
                you figure out how to fix it. That mindset stuck with me through quarry work, 
                construction, and eventually into tech. Turns out the same kind of thinking 
                that keeps equipment running also keeps networks secure and code clean.
              </p>
              <p>
                These days I work at the intersection of IT and industrial systems: SCADA, PLCs, 
                enterprise networks, the whole stack. But what I really enjoy is building 
                software: full-stack apps, automation tools, anything that solves a real problem.
                I care about craft, and I like working on things that matter.
              </p>
            </div>
          </motion.section>

          {/* Professional Journey Timeline */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ color: 'var(--term-primary)' }}
            >
              <span style={{ color: 'var(--term-muted)' }}>[</span>
              EXPERIENCE
              <span style={{ color: 'var(--term-muted)' }}>]</span>
            </h2>
            <div
              className="overflow-hidden"
              style={{ color: 'var(--term-secondary)', background: 'transparent' }}
            >
              <div
                className="text-[11px] xs:text-[12px] sm:text-[14px] md:text-xs lg:text-sm leading-tight whitespace-pre font-mono"
                style={{ width: 'fit-content' }}
              >
                {JOURNEY_TIMELINE}
              </div>
            </div>
          </motion.section>

          {/* Skills Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ color: 'var(--term-primary)' }}
            >
              <span style={{ color: 'var(--term-muted)' }}>[</span>
              SKILLS
              <span style={{ color: 'var(--term-muted)' }}>]</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-2 sm:pl-4">
              {skills.map((group) => (
                <div key={group.category}>
                  <h3
                    className="text-sm font-medium mb-2"
                    style={{ color: 'var(--term-secondary)' }}
                  >
                    {group.category}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-1 text-sm"
                        style={{
                          backgroundColor: 'var(--term-selection)',
                          color: 'var(--term-foreground)',
                        }}
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Contact Section */}
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2
              className="text-lg font-bold mb-3 flex items-center gap-2"
              style={{ color: 'var(--term-primary)' }}
            >
              <span style={{ color: 'var(--term-muted)' }}>[</span>
              CONTACT
              <span style={{ color: 'var(--term-muted)' }}>]</span>
            </h2>
            <div className="space-y-3 pl-2 sm:pl-4">
              {contacts.map((contact) => (
                <div key={contact.label} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                  <span
                    className="text-sm sm:w-20"
                    style={{ color: 'var(--term-muted)' }}
                  >
                    {contact.label}
                  </span>
                  <a
                    href={contact.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-dotted hover:decoration-solid touch-manipulation py-1"
                    style={{ color: 'var(--term-primary)' }}
                  >
                    {contact.value}
                  </a>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </div>

      {/* Touch Navigation Bar */}
      <div
        className="shrink-0 border-t p-2"
        style={{ borderColor: 'var(--term-border)', backgroundColor: 'var(--term-selection)' }}
      >
        <TouchNav actions={navActions} />
      </div>
    </div>
  );
};

export default AboutApp;
