import type { Project } from '../machines/portfolioMachine';

/**
 * Sample portfolio projects.
 * Replace with your actual projects.
 */
export const sampleProjects: Project[] = [
  {
    id: 'tui-portfolio',
    title: 'TUI Portfolio',
    description:
      'A terminal-inspired portfolio and blog built with React, XState, and Tailwind CSS. Features keyboard-first navigation and retro aesthetics.',
    technologies: ['React', 'TypeScript', 'XState', 'Tailwind CSS', 'Vite'],
    github: 'https://github.com/username/tui-portfolio',
  },
  {
    id: 'cli-tool',
    title: 'CLI Task Manager',
    description:
      'A command-line task management tool with vim-like keybindings. Supports projects, tags, and due dates.',
    technologies: ['Rust', 'SQLite', 'TUI-rs'],
    github: 'https://github.com/username/cli-task-manager',
  },
  {
    id: 'api-gateway',
    title: 'API Gateway',
    description:
      'High-performance API gateway with rate limiting, authentication, and request transformation capabilities.',
    technologies: ['Go', 'Redis', 'PostgreSQL', 'Docker'],
    github: 'https://github.com/username/api-gateway',
  },
  {
    id: 'real-time-dashboard',
    title: 'Real-time Dashboard',
    description:
      'Live monitoring dashboard for infrastructure metrics. WebSocket-based updates with customizable widgets.',
    technologies: ['Next.js', 'WebSocket', 'D3.js', 'InfluxDB'],
    link: 'https://dashboard.example.com',
  },
  {
    id: 'ml-pipeline',
    title: 'ML Pipeline Framework',
    description:
      'End-to-end machine learning pipeline framework with experiment tracking and model versioning.',
    technologies: ['Python', 'PyTorch', 'MLflow', 'Kubernetes'],
    github: 'https://github.com/username/ml-pipeline',
  },
  {
    id: 'design-system',
    title: 'Component Library',
    description:
      'Accessible React component library with comprehensive documentation and Storybook integration.',
    technologies: ['React', 'Storybook', 'Radix UI', 'CSS Modules'],
    link: 'https://components.example.com',
    github: 'https://github.com/username/component-library',
  },
];

/**
 * Load portfolio projects.
 */
export async function loadProjects(): Promise<Project[]> {
  return Promise.resolve(sampleProjects);
}

/**
 * Get a single project by ID.
 */
export async function getProjectById(id: string): Promise<Project | null> {
  const projects = await loadProjects();
  return projects.find((p) => p.id === id) || null;
}



