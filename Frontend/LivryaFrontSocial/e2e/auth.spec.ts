import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * Tests login, register, and protected routes
 * 
 * Test Users:
 * - USER: usuario@livrya.com.br / User@2024!
 * - WRITER: escritor@livrya.com.br / Writer@2024!
 * - PRO: pro@livrya.com.br / Pro@2024!
 * - ADMIN: sophia@livrya.com.br / Livrya@2024!
 */

const TEST_USERS = {
  USER: { email: 'usuario@livrya.com.br', password: 'User@2024!' },
  WRITER: { email: 'escritor@livrya.com.br', password: 'Writer@2024!' },
  PRO: { email: 'pro@livrya.com.br', password: 'Pro@2024!' },
  ADMIN: { email: 'sophia@livrya.com.br', password: 'Livrya@2024!' }
};

test.describe('Authentication', () => {
  
  test.beforeEach(async ({ page }) => {
    // Clear any stored tokens before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Check page title and form elements
    await expect(page.locator('h1')).toContainText(/bem-vindo/i);
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should display register page', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Check registration form elements
    await expect(page.locator('input[formcontrolname="name"], #name')).toBeVisible();
    await expect(page.locator('input[formcontrolname="email"], #email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('should show validation errors on empty login', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Focus and blur fields to trigger validation
    await page.locator('#email').click();
    await page.locator('#password').click();
    await page.locator('#email').click();
    
    // Should show validation messages
    await expect(page.locator('text=/obrigatório/i').first()).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill with invalid credentials
    await page.locator('#email').fill('invalid@test.com');
    await page.locator('#password input, input[type="password"]').first().fill('wrongpassword123');
    await page.locator('button[type="submit"]').click();
    
    // Should show error message (p-message component or error text)
    await expect(page.locator('p-message').first()).toBeVisible({ timeout: 10000 });
  });

  test('should login successfully with USER account', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Wait for form to be ready
    await page.locator('#email').waitFor({ state: 'visible' });
    
    // Fill with valid credentials
    await page.locator('#email').fill(TEST_USERS.USER.email);
    await page.locator('input[type="password"], p-password input').first().fill(TEST_USERS.USER.password);
    
    // Wait for button to be enabled then click
    await page.locator('button[type="submit"]:not([disabled])').click();
    
    // Should redirect to writer area, dashboard, social or feed
    await expect(page).toHaveURL(/writer|dashboard|social|feed/, { timeout: 30000 });
  });

  test('should login successfully with WRITER account', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.locator('#email').waitFor({ state: 'visible' });
    await page.locator('#email').fill(TEST_USERS.WRITER.email);
    await page.locator('input[type="password"], p-password input').first().fill(TEST_USERS.WRITER.password);
    await page.locator('button[type="submit"]:not([disabled])').click();
    
    await expect(page).toHaveURL(/writer|dashboard|social|feed/, { timeout: 30000 });
  });

  test('should login successfully with PRO account', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.locator('#email').waitFor({ state: 'visible' });
    await page.locator('#email').fill(TEST_USERS.PRO.email);
    await page.locator('input[type="password"], p-password input').first().fill(TEST_USERS.PRO.password);
    await page.locator('button[type="submit"]:not([disabled])').click();
    
    await expect(page).toHaveURL(/writer|dashboard|social|feed/, { timeout: 30000 });
  });

  test('should login successfully with ADMIN account', async ({ page }) => {
    await page.goto('/auth/login');
    
    await page.locator('#email').waitFor({ state: 'visible' });
    await page.locator('#email').fill(TEST_USERS.ADMIN.email);
    await page.locator('input[type="password"], p-password input').first().fill(TEST_USERS.ADMIN.password);
    await page.locator('button[type="submit"]:not([disabled])').click();
    
    await expect(page).toHaveURL(/writer|dashboard|social|feed/, { timeout: 30000 });
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Try to access protected route
    await page.goto('/social/feed');
    
    // Should redirect to login
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('should have link to register from login page', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Find and click register link
    const registerLink = page.locator('a[href*="signup"], a:has-text("cadastr")').first();
    await expect(registerLink).toBeVisible();
    await registerLink.click();
    
    await expect(page).toHaveURL(/signup/);
  });

  test('should have link to login from register page', async ({ page }) => {
    await page.goto('/auth/signup');
    
    // Find and click login link
    const loginLink = page.locator('a[href*="login"], a:has-text("entrar"), a:has-text("já")').first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    
    await expect(page).toHaveURL(/login/);
  });
});

test.describe('Protected Routes Guard', () => {
  
  test('should protect dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('should protect social feed route', async ({ page }) => {
    await page.goto('/social/feed');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('should protect messages route', async ({ page }) => {
    await page.goto('/social/messages');
    await expect(page).toHaveURL(/auth\/login/);
  });

  test('should protect notifications route', async ({ page }) => {
    await page.goto('/social/notifications');
    await expect(page).toHaveURL(/auth\/login/);
  });
});
