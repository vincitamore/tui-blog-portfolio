import React, { useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface AboutAppProps {
  onBack: () => void;
}

/**
 * About TUI Application
 * Displays information in a terminal-style format
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
    { category: 'Network Engineering', items: ['Fiber Optics', 'SCADA Networks', 'Wireless', 'IT/OT Integration'] },
    { category: 'System Admin', items: ['Active Directory', 'Azure AD', 'Windows Server', 'UEM'] },
    { category: 'Cybersecurity', items: ['EDR/XDR', 'Security Onion', 'OT/ICS Security', 'SIEM'] },
    { category: 'Development', items: ['TypeScript', 'React', 'Next.js', 'Python'] },
    { category: 'Cloud Services', items: ['Azure', 'Office 365', 'Identity Solutions'] },
    { category: 'Infrastructure', items: ['PLC Programming', 'Industrial Control', 'Automation'] },
    { category: 'Databases', items: ['SQL Server', 'PostgreSQL', 'TimescaleDB', 'SQLite'] },
    { category: 'Leadership', items: ['Project Management', 'Team Leadership', 'Documentation'] },
  ];

  const contacts = [
    { label: 'Email', value: 'vincit_amore@amore.build', href: 'mailto:vincit_amore@amore.build' },
    { label: 'GitHub', value: 'github.com/vincitamore', href: 'https://github.com/vincitamore' },
    { label: 'X', value: '@vincit_amore', href: 'https://x.com/vincit_amore' },
    { label: 'Website', value: 'amore.build', href: 'https://amore.build' },
  ];

  return (
    <div className="h-full overflow-auto p-4" style={{ color: 'var(--term-foreground)' }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-2 py-1 mb-6 border-b"
        style={{ borderColor: 'var(--term-border)' }}
      >
        <span style={{ color: 'var(--term-primary)' }}>ABOUT</span>
        <span style={{ color: 'var(--term-muted)' }}>[q] quit</span>
      </div>

      <div className="space-y-8 px-2">
        {/* ASCII Art Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs leading-tight whitespace-pre font-mono text-center"
          style={{ color: 'var(--term-primary)', background: 'transparent' }}
        >
{`╔════════════════════════════════════════════════════════════════════╗
║  ██████╗ ██╗   ██╗██╗    ██╗   ██╗██╗███╗   ██╗ ██████╗██╗████████╗║
║ ██╔═══██╗██║   ██║██║    ██║   ██║██║████╗  ██║██╔════╝██║╚══██╔══╝║
║ ██║   ██║██║   ██║██║    ██║   ██║██║██╔██╗ ██║██║     ██║   ██║   ║
║ ██║▄▄ ██║██║   ██║██║    ╚██╗ ██╔╝██║██║╚██╗██║██║     ██║   ██║   ║
║ ╚██████╔╝╚██████╔╝██║     ╚████╔╝ ██║██║ ╚████║╚██████╗██║   ██║   ║
║  ╚══▀▀═╝  ╚═════╝ ╚═╝      ╚═══╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝╚═╝   ╚═╝   ║
╠════════════════════════════════════════════════════════════════════╣
║   "Qui vincit, vincit amore" - He who conquers, conquers by love   ║
╚════════════════════════════════════════════════════════════════════╝`}
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
          <div className="space-y-3 pl-4" style={{ color: 'var(--term-foreground)' }}>
            <p className="italic" style={{ color: 'var(--term-secondary)' }}>
              Crafting elegant solutions with passion and precision. From infrastructure 
              to interface, building technology that empowers and endures.
            </p>
            <p>
              My diverse background spans technology, industrial operations, and agriculture.
              This unique combination brings a practical, solution-oriented approach to
              technical challenges, grounded in real-world experience and a deep understanding
              of various industries.
            </p>
            <p>
              Each stage of this journey has contributed to a comprehensive understanding of
              complex systems. Agricultural roots taught systematic thinking and resourceful
              problem-solving. Industrial operations developed process optimization and
              safety-critical decision-making. Technical roles honed network engineering and
              security expertise. This diverse foundation enables me to bridge the gap between
              infrastructure and innovation, delivering solutions that are both technically
              sophisticated and practically grounded.
            </p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-4">
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
                      className="px-2 py-0.5 text-sm"
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
          <div className="space-y-2 pl-4">
            {contacts.map((contact) => (
              <div key={contact.label} className="flex items-center gap-4">
                <span
                  className="w-20 text-sm"
                  style={{ color: 'var(--term-muted)' }}
                >
                  {contact.label}
                </span>
                <a
                  href={contact.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted hover:decoration-solid"
                  style={{ color: 'var(--term-primary)' }}
                >
                  {contact.value}
                </a>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="pt-4 border-t text-sm"
          style={{ borderColor: 'var(--term-border)', color: 'var(--term-muted)' }}
        >
          Press [q] or [Esc] to return to terminal
        </motion.div>
      </div>
    </div>
  );
};

export default AboutApp;

