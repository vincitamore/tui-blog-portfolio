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
  onPasswordChange?: () => void;
}

export interface CommandHandler {
  description: string;
  usage?: string;
  execute: (args: string[], context?: CommandContext) => CommandResult | CommandResult[];
}

// Split banner into header (ASCII art) and footer (text) for different sizing
const ASCII_LOGO_HEADER = `\
 █████╗ ███╗   ███╗ ██████╗ ██████╗ ███████╗   ██████╗ ██╗   ██╗██╗██╗     ██████╗
██╔══██╗████╗ ████║██╔═══██╗██╔══██╗██╔════╝   ██╔══██╗██║   ██║██║██║     ██╔══██╗
███████║██╔████╔██║██║   ██║██████╔╝█████╗     ██████╔╝██║   ██║██║██║     ██║  ██║
██╔══██║██║╚██╔╝██║██║   ██║██╔══██╗██╔══╝     ██╔══██╗██║   ██║██║██║     ██║  ██║
██║  ██║██║ ╚═╝ ██║╚██████╔╝██║  ██║███████╗██╗██████╔╝╚██████╔╝██║███████╗██████╔╝
╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚═╝╚═════╝  ╚═════╝ ╚═╝╚══════╝╚═════╝`;

const ASCII_LOGO_FOOTER = `
╔═══════════════════════════════════════════════════════════════════════════════════╗
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
          '  dashboard         Show admin dashboard',
          '  visitors          View recent visitor logs',
          '  comments          List recent comments',
          '  ban <ip>          Ban an IP address',
          '  unban <ip>        Unban an IP address',
          '  delete-comment    Delete a comment (interactive)',
          '  claude-org        Connect to Claude Code session',
          '  passwd            Change admin password',
          '  logout            Exit admin session',
        ] : []),
        '',
        'Navigation:',
        '  Use arrow keys or vim keys (j/k) to navigate',
        '  Press Enter to select, Esc to go back',
        '  Click on underlined text for quick navigation',
        '',
        'Tab completion available for all commands',
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
      target: 'whoami',
      content: context?.isAdmin ? 'admin' : 'visitor',
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

  passwd: {
    description: 'Change admin password',
    execute: (_args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Permission denied. Must be admin to change password.' };
      }
      // Signal to trigger password change prompt
      return { type: 'output', target: 'password_change', content: '' };
    },
  },

  visitors: {
    description: 'View recent visitor logs',
    execute: (_args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Permission denied. Admin only.' };
      }
      // Signal to fetch and display visitor logs
      return { type: 'output', target: 'visitors', content: '' };
    },
  },

  dashboard: {
    description: 'Show admin dashboard',
    execute: (_args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Permission denied. Admin only.' };
      }
      // Signal to fetch and display admin dashboard
      return { type: 'output', target: 'dashboard', content: '' };
    },
  },

  comments: {
    description: 'List recent comments',
    execute: (_args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Permission denied. Admin only.' };
      }
      // Signal to fetch and display comments list
      return { type: 'output', target: 'comments', content: '' };
    },
  },

  ban: {
    description: 'Ban an IP address',
    usage: 'ban <ip> [reason]',
    execute: (args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Permission denied. Admin only.' };
      }
      if (!args[0]) {
        return { type: 'error', content: 'Usage: ban <ip> [reason]' };
      }
      const ip = args[0];
      const reason = args.slice(1).join(' ') || 'Banned via CLI';
      // Signal to ban IP - App.tsx will handle the API call
      return { type: 'output', target: 'ban_ip', content: JSON.stringify({ ip, reason }) };
    },
  },

  unban: {
    description: 'Unban an IP address',
    usage: 'unban <ip>',
    execute: (args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Permission denied. Admin only.' };
      }
      if (!args[0]) {
        return { type: 'error', content: 'Usage: unban <ip>' };
      }
      // Signal to unban IP - App.tsx will handle the API call
      return { type: 'output', target: 'unban_ip', content: args[0] };
    },
  },

  'delete-comment': {
    description: 'Delete a comment',
    usage: 'delete-comment <post-slug> <comment-id>',
    execute: (args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Permission denied. Admin only.' };
      }
      if (args.length < 2) {
        return { type: 'error', content: 'Usage: delete-comment <post-slug> <comment-id>' };
      }
      const [postSlug, commentId] = args;
      // Signal to delete comment - App.tsx will handle the API call
      return { type: 'output', target: 'delete_comment', content: JSON.stringify({ postSlug, commentId }) };
    },
  },

  'claude-org': {
    description: 'Connect to Claude Code session',
    execute: (_args, context) => {
      if (!context?.isAdmin) {
        return { type: 'error', content: 'Permission denied. Admin only.' };
      }
      // Signal to initiate connection - App.tsx will handle
      return { type: 'output', target: 'ssh_connect', content: '' };
    },
  },

  neofetch: {
    description: 'System information',
    execute: (_args, context) => {
      const themeName = context?.currentTheme || 'dracula';
      const themeLabel = themes[themeName]?.label || themeName;
      // Return special neofetch type for responsive rendering
      return {
        type: 'output',
        target: 'neofetch',
        content: JSON.stringify({ theme: themeLabel }),
      };
    },
  },

  contact: {
    description: 'Show contact information',
    execute: () => ({
      type: 'output',
      target: 'contact',
      content: '',
    }),
  },

  skills: {
    description: 'List technical skills',
    execute: () => ({
      type: 'output',
      target: 'skills',
      content: '',
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

export function getWelcomeMessage(): { header: string; footer: string } {
  return { header: ASCII_LOGO_HEADER, footer: ASCII_LOGO_FOOTER };
}

// Admin-only commands that should only appear in suggestions when admin
const adminOnlyCommands = ['dashboard', 'visitors', 'comments', 'ban', 'unban', 'delete-comment', 'claude-org', 'passwd', 'logout', 'exit'];

export function getCommandSuggestions(input: string, isAdmin = false): string[] {
  const lower = input.toLowerCase();
  const hiddenAliases = ['?', 'dir', 'cls', 'list', 'open', 'exit'];

  return Object.keys(commands).filter((cmd) => {
    // Filter out hidden aliases
    if (hiddenAliases.includes(cmd)) return false;
    // Filter out admin commands if not admin
    if (!isAdmin && adminOnlyCommands.includes(cmd)) return false;
    // Match prefix
    return cmd.startsWith(lower);
  });
}
