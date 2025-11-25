/**
 * Terminal Command Parser
 * Handles all commands for navigation and interaction
 */

import { themes } from './themes';

export interface CommandResult {
  type: 'output' | 'error' | 'success' | 'info' | 'navigate' | 'clear' | 'theme';
  content?: string;
  target?: string;
  lines?: string[];
}

export interface CommandContext {
  currentTheme?: string;
  isAdmin?: boolean;
  onAdminLogin?: () => void;
  onAdminLogout?: () => void;
}

export interface CommandHandler {
  description: string;
  usage?: string;
  execute: (args: string[], context?: CommandContext) => CommandResult | CommandResult[];
}

const ASCII_LOGO = `
╔═══════════════════════════════════════════════════════════════════════════════════╗
║ █████╗ ███╗   ███╗ ██████╗ ██████╗ ███████╗   ██████╗ ██╗   ██╗██╗██╗     ██████╗ ║
║██╔══██╗████╗ ████║██╔═══██╗██╔══██╗██╔════╝   ██╔══██╗██║   ██║██║██║     ██╔══██╗║
║███████║██╔████╔██║██║   ██║██████╔╝█████╗     ██████╔╝██║   ██║██║██║     ██║  ██║║
║██╔══██║██║╚██╔╝██║██║   ██║██╔══██╗██╔══╝     ██╔══██╗██║   ██║██║██║     ██║  ██║║
║██║  ██║██║ ╚═╝ ██║╚██████╔╝██║  ██║███████╗██╗██████╔╝╚██████╔╝██║███████╗██████╔╝║
║╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝ ║
╠═══════════════════════════════════════════════════════════════════════════════════╣
║                           Qui vincit, vincit amore                                ║
║                      "He who conquers, conquers by love"                          ║
║                                                                                   ║
║                       Type 'help' for available commands                          ║
╚═══════════════════════════════════════════════════════════════════════════════════╝
`.trim();

const commands: Record<string, CommandHandler> = {
  help: {
    description: 'Show available commands',
    execute: (_args, context) => ({
      type: 'output',
      lines: [
        '',
        'Available commands:',
        '',
        '  help              Show this help message',
        '  ls, dir           List available sections',
        '  cd <section>      Navigate to a section',
        '  portfolio         Open portfolio viewer',
        '  blog              Open blog reader',
        '  about             View about page',
        '  theme [name]      Change or list themes',
        '  whoami            Display visitor info',
        '  clear, cls        Clear terminal',
        '  neofetch          System information',
        '  contact           Show contact information',
        '  skills            List technical skills',
        ...(context?.isAdmin ? [
          '',
          'Admin commands:',
          '  logout            Exit admin session',
        ] : []),
        '',
        'Navigation:',
        '  Use arrow keys or vim keys (j/k) to navigate',
        '  Press Enter to select, Esc to go back',
        '  Click on underlined text for quick navigation',
        '',
      ],
    }),
  },

  ls: {
    description: 'List available sections',
    execute: () => ({
      type: 'output',
      lines: [
        '',
        'drwxr-xr-x  visitor  portfolio/',
        'drwxr-xr-x  visitor  blog/',
        'drwxr-xr-x  visitor  about/',
        '-rw-r--r--  visitor  README.md',
        '',
        'Use "cd <section>" to navigate',
        '',
      ],
    }),
  },

  dir: {
    description: 'List available sections (alias for ls)',
    execute: () => commands.ls.execute([]),
  },

  cd: {
    description: 'Navigate to a section',
    usage: 'cd <section>',
    execute: (args) => {
      const section = args[0]?.toLowerCase().replace(/\/$/, '');
      if (!section) {
        return { type: 'error', content: 'Usage: cd <section>' };
      }
      if (['portfolio', 'blog', 'about'].includes(section)) {
        return [
          { type: 'info', content: `Launching ${section}...` },
          { type: 'navigate', target: section },
        ];
      }
      if (section === '..') {
        return { type: 'info', content: 'Already at home directory' };
      }
      return { type: 'error', content: `cd: ${section}: No such directory` };
    },
  },

  portfolio: {
    description: 'Open portfolio viewer',
    execute: () => [
      { type: 'info', content: 'Launching portfolio...' },
      { type: 'navigate', target: 'portfolio' },
    ],
  },

  blog: {
    description: 'Open blog reader',
    execute: () => [
      { type: 'info', content: 'Launching blog...' },
      { type: 'navigate', target: 'blog' },
    ],
  },

  about: {
    description: 'View about page',
    execute: () => [
      { type: 'info', content: 'Loading about...' },
      { type: 'navigate', target: 'about' },
    ],
  },

  theme: {
    description: 'Change or list themes',
    usage: 'theme [name]',
    execute: (args) => {
      if (args.length === 0) {
        const themeList = Object.entries(themes)
          .map(([name, t]) => `  ${name.padEnd(12)} ${t.label}`)
          .join('\n');
        return {
          type: 'output',
          lines: ['', 'Available themes:', '', themeList, '', 'Usage: theme <name>', ''],
        };
      }
      const themeName = args[0].toLowerCase();
      if (themes[themeName]) {
        return { type: 'theme', target: themeName, content: `Theme changed to ${themeName}` };
      }
      return { type: 'error', content: `Unknown theme: ${themeName}` };
    },
  },

  clear: {
    description: 'Clear terminal',
    execute: () => ({ type: 'clear' }),
  },

  cls: {
    description: 'Clear terminal (alias)',
    execute: () => ({ type: 'clear' }),
  },

  whoami: {
    description: 'Display visitor info',
    execute: (_args, context) => ({
      type: 'output',
      content: context?.isAdmin ? 'admin (elevated)' : 'visitor',
    }),
  },

  sudo: {
    description: 'Elevate privileges',
    usage: 'sudo admin',
    execute: (args, context) => {
      if (args[0] === 'admin') {
        if (context?.isAdmin) {
          return { type: 'info', content: 'Already logged in as admin' };
        }
        // Signal to trigger password prompt
        return { type: 'output', target: 'admin_login', content: '' };
      }
      return { type: 'error', content: 'Usage: sudo admin' };
    },
  },

  logout: {
    description: 'Logout from admin session',
    execute: (_args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Not logged in as admin' };
      }
      context.onAdminLogout?.();
      return { type: 'success', content: 'Logged out from admin session' };
    },
  },

  exit: {
    description: 'Exit admin session (alias for logout)',
    execute: (args, context) => commands.logout.execute(args, context),
  },

  neofetch: {
    description: 'System information',
    execute: (_args, context) => {
      const themeName = context?.currentTheme || 'dracula';
      const themeLabel = themes[themeName]?.label || themeName;
      return {
        type: 'output',
        lines: [
            '',
            '    ▄██▄ ▄██▄ ▄██▄        vincit_amore@amore.build',
            '    ██████████████        ────────────────────────',
            '    ▀▀▀▀ ▀▀▀▀ ▀▀▀▀        Title: Fullstack Engineer',
            '      ▄█▄    ▄█▄          Motto: Qui vincit, vincit amore',
            '    ▄█████▄▄█████▄        OS: Terminal Portfolio v1.0',
            '    ██████████████        Shell: custom-zsh',
            '    ▀████████████▀        Terminal: xterm-256color',
            '      ▀████████▀          Resolution: Responsive',
            `        ▀████▀            Theme: ${themeLabel}`,
            '          ▀▀',
            '                          Stack: React, TypeScript, XState',
            '                          Focus: IT/OT, SCADA, Full Stack',
            '',
        ],
      };
    },
  },

  contact: {
    description: 'Show contact information',
    execute: () => ({
      type: 'output',
      lines: [
        '',
        'Contact Information:',
        '',
        '  Email     vincit_amore@amore.build',
        '  GitHub    github.com/vincitamore',
        '  X         @vincit_amore',
        '  Website   amore.build',
        '',
      ],
    }),
  },

  skills: {
    description: 'List technical skills',
    execute: () => ({
      type: 'output',
      lines: [
        '',
        'Technical Skills:',
        '',
        '  Network      Fiber Optics, SCADA, Wireless, IT/OT Integration',
        '  Systems      Active Directory, Azure AD, Windows Server, UEM',
        '  Security     EDR/XDR, Security Onion, OT/ICS Security, SIEM',
        '  Development  TypeScript, React, Next.js, Python, Node.js',
        '  Cloud        Azure, Office 365, Identity Solutions',
        '  Industrial   PLC Programming, Control Systems, Automation',
        '  Databases    SQL Server, PostgreSQL, TimescaleDB, SQLite',
        '  Leadership   Project Management, Team Leadership, Documentation',
        '',
      ],
    }),
  },

  echo: {
    description: 'Echo text',
    execute: (args) => ({
      type: 'output',
      content: args.join(' '),
    }),
  },

  cat: {
    description: 'Display file contents',
    usage: 'cat <file>',
    execute: (args) => {
      if (!args[0]) {
        return { type: 'error', content: 'Usage: cat <file>' };
      }
      if (args[0] === 'README.md') {
        return {
          type: 'output',
          lines: [
            '',
            '# Terminal Portfolio',
            '',
            'A terminal-style portfolio website.',
            '',
            '## Quick Start',
            '',
            'Type `help` to see available commands.',
            'Use `cd <section>` or click on links to navigate.',
            '',
            '## Features',
            '',
            '- Real terminal feel with command input',
            '- Keyboard-first navigation',
            '- Multiple color themes',
            '- Fully responsive',
            '',
          ],
        };
      }
      return { type: 'error', content: `cat: ${args[0]}: No such file` };
    },
  },
};

// Aliases
commands['?'] = commands.help;
commands['list'] = commands.ls;
commands['open'] = commands.cd;

export function parseCommand(input: string, context?: CommandContext): CommandResult[] {
  const trimmed = input.trim();
  if (!trimmed) return [];

  const parts = trimmed.split(/\s+/);
  const cmd = parts[0].toLowerCase();
  const args = parts.slice(1);

  const handler = commands[cmd];
  if (!handler) {
    return [{ type: 'error', content: `Command not found: ${cmd}. Type 'help' for commands.` }];
  }

  const result = handler.execute(args, context);
  return Array.isArray(result) ? result : [result];
}

export function getWelcomeMessage(): string {
  return ASCII_LOGO;
}

export function getCommandSuggestions(input: string): string[] {
  const lower = input.toLowerCase();
  return Object.keys(commands).filter(
    (cmd) => cmd.startsWith(lower) && !['?', 'dir', 'cls', 'list', 'open'].includes(cmd),
  );
}
