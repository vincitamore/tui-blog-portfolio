import { assign, createMachine, type ActorRefFrom } from 'xstate';

/**
 * Context for the app machine.
 * Holds the current menu index for the welcome screen navigation.
 */
export type AppContext = {
  readonly menuIndex: number;
};

/**
 * Events for the app machine.
 * Dispatched from keyboard handlers in App.tsx.
 */
export type AppEvent =
  | { type: 'KEY_UP' }
  | { type: 'KEY_DOWN' }
  | { type: 'KEY_LEFT' }
  | { type: 'KEY_RIGHT' }
  | { type: 'SELECT' }
  | { type: 'BACK' }
  | { type: 'TAB_NEXT' }
  | { type: 'TAB_PREV' };

/**
 * Possible state values of the app machine.
 * Corresponds to rendered screens.
 */
export type AppStateValue = 'welcome' | 'portfolio' | 'blog' | 'about';

/**
 * Fully-typed ActorRef for the app machine.
 * Use with `useMachine(appMachine)` or `useActor(appMachine)` in React.
 */
export type AppActorRef = ActorRefFrom<ReturnType<typeof createAppMachine>>;

/**
 * Static menu items for the welcome screen.
 * Index 0: portfolio, 1: blog, 2: about.
 * Used for bounds checking and SELECT transitions.
 */
const MENU_ITEMS = ['portfolio', 'blog', 'about'] as const;
const MENU_LENGTH = MENU_ITEMS.length;

/**
 * XState v5 finite state machine for TUI screen navigation.
 *
 * ## States (Screens)
 * - `welcome`: Keyboard-navigable menu (up/down arrows, enter to select, esc noop)
 * - `portfolio` / `blog` / `about`: Leaf screens (arrows/enter ignored, esc to welcome)
 *
 * ## Context
 * - `menuIndex`: Selected item in welcome menu (0-2, bounds-checked)
 *
 * ## Events (from keydown handlers)
 * - `KEY_UP` / `KEY_DOWN`: Adjust `menuIndex` (welcome only, bounds-checked)
 * - `KEY_LEFT` / `KEY_RIGHT`: Reserved for future horizontal navigation
 * - `SELECT` (Enter): Transition to MENU_ITEMS[menuIndex] from welcome
 * - `BACK` (Esc): Reset to welcome + menuIndex=0 (noop in welcome)
 * - `TAB_NEXT` / `TAB_PREV`: Same as KEY_DOWN / KEY_UP for menu cycling
 */
function createAppMachine() {
  return createMachine({
    id: 'appMachine',
    initial: 'welcome',
    context: {
      menuIndex: 0,
    } as AppContext,
    states: {
      welcome: {
        on: {
          KEY_UP: {
            actions: assign({
              menuIndex: ({ context }) => Math.max(0, context.menuIndex - 1),
            }),
          },
          KEY_DOWN: {
            actions: assign({
              menuIndex: ({ context }) => Math.min(MENU_LENGTH - 1, context.menuIndex + 1),
            }),
          },
          TAB_NEXT: {
            actions: assign({
              menuIndex: ({ context }) => (context.menuIndex + 1) % MENU_LENGTH,
            }),
          },
          TAB_PREV: {
            actions: assign({
              menuIndex: ({ context }) => (context.menuIndex - 1 + MENU_LENGTH) % MENU_LENGTH,
            }),
          },
          KEY_LEFT: {}, // noop - reserved for future use
          KEY_RIGHT: {}, // noop - reserved for future use
          SELECT: [
            { target: 'portfolio', guard: ({ context }) => context.menuIndex === 0 },
            { target: 'blog', guard: ({ context }) => context.menuIndex === 1 },
            { target: 'about', guard: ({ context }) => context.menuIndex === 2 },
          ],
          BACK: {}, // noop in welcome
        },
      },
      portfolio: {
        on: {
          KEY_UP: {},
          KEY_DOWN: {},
          KEY_LEFT: {},
          KEY_RIGHT: {},
          TAB_NEXT: {},
          TAB_PREV: {},
          SELECT: {},
          BACK: {
            target: 'welcome',
            actions: assign({ menuIndex: () => 0 }),
          },
        },
      },
      blog: {
        on: {
          KEY_UP: {},
          KEY_DOWN: {},
          KEY_LEFT: {},
          KEY_RIGHT: {},
          TAB_NEXT: {},
          TAB_PREV: {},
          SELECT: {},
          BACK: {
            target: 'welcome',
            actions: assign({ menuIndex: () => 0 }),
          },
        },
      },
      about: {
        on: {
          KEY_UP: {},
          KEY_DOWN: {},
          KEY_LEFT: {},
          KEY_RIGHT: {},
          TAB_NEXT: {},
          TAB_PREV: {},
          SELECT: {},
          BACK: {
            target: 'welcome',
            actions: assign({ menuIndex: () => 0 }),
          },
        },
      },
    },
  });
}

export const appMachine = createAppMachine();
