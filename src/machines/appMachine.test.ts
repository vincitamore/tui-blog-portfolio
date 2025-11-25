import { describe, it, expect } from 'vitest';
import { createActor } from 'xstate';
import { appMachine } from './appMachine';

describe('appMachine', () => {
  describe('initial state', () => {
    it('should start in welcome state', () => {
      const actor = createActor(appMachine);
      actor.start();
      expect(actor.getSnapshot().value).toBe('welcome');
      actor.stop();
    });

    it('should have menuIndex 0 initially', () => {
      const actor = createActor(appMachine);
      actor.start();
      expect(actor.getSnapshot().context.menuIndex).toBe(0);
      actor.stop();
    });
  });

  describe('welcome state navigation', () => {
    it('should increment menuIndex on KEY_DOWN', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'KEY_DOWN' });
      expect(actor.getSnapshot().context.menuIndex).toBe(1);
      actor.stop();
    });

    it('should decrement menuIndex on KEY_UP', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'KEY_UP' });
      expect(actor.getSnapshot().context.menuIndex).toBe(0);
      actor.stop();
    });

    it('should not go below 0 on KEY_UP', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'KEY_UP' });
      expect(actor.getSnapshot().context.menuIndex).toBe(0);
      actor.stop();
    });

    it('should not go above 2 on KEY_DOWN', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'KEY_DOWN' });
      expect(actor.getSnapshot().context.menuIndex).toBe(2);
      actor.stop();
    });

    it('should cycle forward on TAB_NEXT', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'TAB_NEXT' });
      expect(actor.getSnapshot().context.menuIndex).toBe(1);
      actor.send({ type: 'TAB_NEXT' });
      actor.send({ type: 'TAB_NEXT' });
      expect(actor.getSnapshot().context.menuIndex).toBe(0); // Cycles back
      actor.stop();
    });

    it('should cycle backward on TAB_PREV', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'TAB_PREV' });
      expect(actor.getSnapshot().context.menuIndex).toBe(2); // Wraps to end
      actor.stop();
    });
  });

  describe('screen transitions', () => {
    it('should transition to portfolio on SELECT with menuIndex 0', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'SELECT' });
      expect(actor.getSnapshot().value).toBe('portfolio');
      actor.stop();
    });

    it('should transition to blog on SELECT with menuIndex 1', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'SELECT' });
      expect(actor.getSnapshot().value).toBe('blog');
      actor.stop();
    });

    it('should transition to about on SELECT with menuIndex 2', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'SELECT' });
      expect(actor.getSnapshot().value).toBe('about');
      actor.stop();
    });

    it('should return to welcome on BACK from portfolio', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'SELECT' });
      expect(actor.getSnapshot().value).toBe('portfolio');
      actor.send({ type: 'BACK' });
      expect(actor.getSnapshot().value).toBe('welcome');
      actor.stop();
    });

    it('should reset menuIndex to 0 on BACK', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'SELECT' });
      actor.send({ type: 'BACK' });
      expect(actor.getSnapshot().context.menuIndex).toBe(0);
      actor.stop();
    });
  });

  describe('non-welcome states', () => {
    it('should ignore KEY_UP in portfolio state', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'SELECT' });
      const menuIndexBefore = actor.getSnapshot().context.menuIndex;
      actor.send({ type: 'KEY_UP' });
      expect(actor.getSnapshot().context.menuIndex).toBe(menuIndexBefore);
      expect(actor.getSnapshot().value).toBe('portfolio');
      actor.stop();
    });

    it('should ignore SELECT in blog state', () => {
      const actor = createActor(appMachine);
      actor.start();
      actor.send({ type: 'KEY_DOWN' });
      actor.send({ type: 'SELECT' });
      expect(actor.getSnapshot().value).toBe('blog');
      actor.send({ type: 'SELECT' });
      expect(actor.getSnapshot().value).toBe('blog');
      actor.stop();
    });
  });
});



