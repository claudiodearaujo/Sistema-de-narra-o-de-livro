import { test, expect, Page } from '@playwright/test';

/**
 * PWA E2E Tests
 * Tests Progressive Web App functionality
 */

test.describe('PWA Features', () => {

  test('should have valid manifest.webmanifest', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    
    expect(response?.status()).toBe(200);
    
    const manifest = await response?.json();
    
    // Check required fields
    expect(manifest.name).toBe('LIVRIA');
    expect(manifest.short_name).toBe('LIVRIA');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons).toBeInstanceOf(Array);
    expect(manifest.icons.length).toBeGreaterThan(0);
  });

  // Skip in dev mode - Service Worker requires production build
  test.skip('should have service worker registered', async ({ page }) => {
    await page.goto('/');
    
    // Wait for SW to register
    await page.waitForTimeout(2000);
    
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });
    
    expect(swRegistered).toBeTruthy();
  });

  test('should have offline page available', async ({ page }) => {
    const response = await page.goto('/offline.html');
    
    expect(response?.status()).toBe(200);
    
    // Should have offline message
    await expect(page.locator('body')).toContainText(/offline|conexão|internet/i);
  });

  test('should have all required icon sizes', async ({ page }) => {
    const response = await page.goto('/manifest.webmanifest');
    const manifest = await response?.json();
    
    const requiredSizes = ['72x72', '96x96', '128x128', '144x144', '152x152', '192x192', '384x384', '512x512'];
    const iconSizes = manifest.icons.map((icon: any) => icon.sizes);
    
    for (const size of requiredSizes) {
      expect(iconSizes).toContain(size);
    }
  });

  test('should have theme-color meta tag', async ({ page }) => {
    await page.goto('/');
    
    const themeColor = await page.locator('meta[name="theme-color"]').getAttribute('content');
    expect(themeColor).toBeTruthy();
  });

  test('should have viewport meta tag for mobile', async ({ page }) => {
    await page.goto('/');
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content');
    expect(viewport).toContain('width=device-width');
  });
});

test.describe('PWA Caching', () => {

  // Skip in dev mode - Caching requires Service Worker and production build
  test.skip('should cache static assets', async ({ page }) => {
    await page.goto('/');
    
    // Wait for SW to be active
    await page.waitForTimeout(3000);
    
    const cacheNames = await page.evaluate(async () => {
      const caches = await window.caches.keys();
      return caches;
    });
    
    // Should have at least one cache
    expect(cacheNames.length).toBeGreaterThan(0);
    expect(cacheNames.some(name => name.includes('livrya'))).toBeTruthy();
  });
});

test.describe('Mobile Responsiveness', () => {

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/login');
    
    // Form should be visible and usable
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // No horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 10); // 10px tolerance
  });

  test('should have touch-friendly tap targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/auth/login');
    
    // Buttons should have minimum 44x44 touch target
    const submitButton = page.locator('button[type="submit"]');
    const box = await submitButton.boundingBox();
    
    // Allow 40px minimum (some frameworks use 40px)
    expect(box?.height).toBeGreaterThanOrEqual(40);
    expect(box?.width).toBeGreaterThanOrEqual(40);
  });
});
