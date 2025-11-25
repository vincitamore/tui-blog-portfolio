import { test, expect } from '@playwright/test';

test.describe('TUI Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display welcome screen on load', async ({ page }) => {
    await expect(page.getByText('Welcome to My TUI App')).toBeVisible();
  });

  test('should show menu items', async ({ page }) => {
    await expect(page.getByText('Portfolio')).toBeVisible();
    await expect(page.getByText('Blog')).toBeVisible();
    await expect(page.getByText('About')).toBeVisible();
  });

  test('should navigate with arrow keys', async ({ page }) => {
    // Initially Portfolio should be selected
    const menuItems = page.getByRole('menuitem');
    await expect(menuItems.first()).toHaveAttribute('aria-selected', 'true');

    // Press down to select Blog
    await page.keyboard.press('ArrowDown');
    await expect(menuItems.nth(1)).toHaveAttribute('aria-selected', 'true');

    // Press down to select About
    await page.keyboard.press('ArrowDown');
    await expect(menuItems.nth(2)).toHaveAttribute('aria-selected', 'true');

    // Press up to go back to Blog
    await page.keyboard.press('ArrowUp');
    await expect(menuItems.nth(1)).toHaveAttribute('aria-selected', 'true');
  });

  test('should navigate with vim keys (j/k)', async ({ page }) => {
    const menuItems = page.getByRole('menuitem');

    // Press j to go down
    await page.keyboard.press('j');
    await expect(menuItems.nth(1)).toHaveAttribute('aria-selected', 'true');

    // Press k to go up
    await page.keyboard.press('k');
    await expect(menuItems.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('should cycle with Tab', async ({ page }) => {
    const menuItems = page.getByRole('menuitem');

    // Tab cycles forward
    await page.keyboard.press('Tab');
    await expect(menuItems.nth(1)).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Tab');
    await expect(menuItems.nth(2)).toHaveAttribute('aria-selected', 'true');

    // Wraps around
    await page.keyboard.press('Tab');
    await expect(menuItems.first()).toHaveAttribute('aria-selected', 'true');
  });

  test('should navigate to Portfolio on Enter', async ({ page }) => {
    await page.keyboard.press('Enter');
    await expect(page.getByText('Portfolio')).toBeVisible();
    await expect(page.getByText('Showcase of cutting-edge')).toBeVisible();
  });

  test('should navigate to Blog on Enter', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Blog' })).toBeVisible();
  });

  test('should navigate to About on Enter', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'About Me' })).toBeVisible();
  });

  test('should return to welcome on Escape', async ({ page }) => {
    // Go to Portfolio
    await page.keyboard.press('Enter');
    await expect(page.getByText('Portfolio')).toBeVisible();

    // Press Escape to go back
    await page.keyboard.press('Escape');
    await expect(page.getByText('Welcome to My TUI App')).toBeVisible();
  });

  test('should show status bar with current screen', async ({ page }) => {
    const statusBar = page.getByRole('status');
    await expect(statusBar).toContainText('home');

    // Navigate to portfolio
    await page.keyboard.press('Enter');
    await expect(statusBar).toContainText('portfolio');
  });

  test('should be accessible with keyboard only', async ({ page }) => {
    // Verify menu has proper role
    await expect(page.getByRole('menu')).toBeVisible();

    // Verify menu items have proper role
    const menuItems = page.getByRole('menuitem');
    await expect(menuItems).toHaveCount(3);

    // Verify application role
    await expect(page.getByRole('application')).toBeVisible();
  });
});

test.describe('Blog Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
  });

  test('should display blog posts', async ({ page }) => {
    await expect(page.getByText('Welcome to the TUI Blog')).toBeVisible();
  });

  test('should navigate posts with arrow keys', async ({ page }) => {
    await page.keyboard.press('ArrowDown');
    // Second post should be selected
  });

  test('should open post on Enter', async ({ page }) => {
    await page.keyboard.press('Enter');
    await expect(page.getByText('Welcome!')).toBeVisible();
  });

  test('should return to list on Escape', async ({ page }) => {
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');
    await expect(page.getByText('3 posts')).toBeVisible();
  });

  test('should search posts', async ({ page }) => {
    await page.keyboard.press('/');
    await page.keyboard.type('keyboard');
    await expect(page.getByText('Building Keyboard-First')).toBeVisible();
  });
});



