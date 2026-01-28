import { assign, createMachine, type ActorRefFrom } from 'xstate';

/**
 * Project metadata type
 */
export interface Project {
  id: string;
  slug?: string;
  title: string;
  description: string;
  content?: string;  // Full markdown content for detailed view
  technologies: string[];
  link?: string;
  github?: string;
  image?: string;
}

/**
 * Context for the portfolio machine
 */
export interface PortfolioContext {
  projects: Project[];
  selectedIndex: number;
  currentProject: Project | null;
}

/**
 * Events for the portfolio machine
 */
export type PortfolioEvent =
  | { type: 'KEY_UP' }
  | { type: 'KEY_DOWN' }
  | { type: 'KEY_LEFT' }
  | { type: 'KEY_RIGHT' }
  | { type: 'SELECT' }
  | { type: 'BACK' }
  | { type: 'LOAD_PROJECTS'; projects: Project[] };

/**
 * Portfolio states
 */
export type PortfolioStateValue = 'grid' | 'viewing';

/**
 * ActorRef type for the portfolio machine
 */
export type PortfolioActorRef = ActorRefFrom<typeof portfolioMachine>;

/**
 * Calculate grid navigation
 */
const GRID_COLUMNS = 2;

/**
 * XState machine for portfolio navigation
 *
 * States:
 * - grid: Browsing projects in a grid layout
 * - viewing: Viewing a single project details
 */
export const portfolioMachine = createMachine({
  id: 'portfolioMachine',
  initial: 'grid',
  context: {
    projects: [],
    selectedIndex: 0,
    currentProject: null,
  } as PortfolioContext,
  states: {
    grid: {
      on: {
        KEY_UP: {
          actions: assign({
            selectedIndex: ({ context }) =>
              Math.max(0, context.selectedIndex - GRID_COLUMNS),
          }),
        },
        KEY_DOWN: {
          actions: assign({
            selectedIndex: ({ context }) =>
              Math.min(context.projects.length - 1, context.selectedIndex + GRID_COLUMNS),
          }),
        },
        KEY_LEFT: {
          actions: assign({
            selectedIndex: ({ context }) => Math.max(0, context.selectedIndex - 1),
          }),
        },
        KEY_RIGHT: {
          actions: assign({
            selectedIndex: ({ context }) =>
              Math.min(context.projects.length - 1, context.selectedIndex + 1),
          }),
        },
        SELECT: {
          target: 'viewing',
          actions: assign({
            currentProject: ({ context }) => context.projects[context.selectedIndex] || null,
          }),
        },
        LOAD_PROJECTS: {
          actions: assign({
            projects: ({ event }) => event.projects,
          }),
        },
        BACK: {}, // Handled by parent machine
      },
    },
    viewing: {
      on: {
        BACK: {
          target: 'grid',
          actions: assign({
            currentProject: () => null,
          }),
        },
        KEY_UP: {},
        KEY_DOWN: {},
        KEY_LEFT: {},
        KEY_RIGHT: {},
        SELECT: {},
      },
    },
  },
});



