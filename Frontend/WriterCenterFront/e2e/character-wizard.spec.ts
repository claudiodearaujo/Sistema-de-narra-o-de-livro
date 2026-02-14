/**
 * E2E Tests for Character Wizard
 * Tests complete user flows: create, edit, save, navigate
 */

import { test, expect } from '@playwright/test';

// Note: These tests require the application to be running
// Run with: npm run test:e2e

test.describe('Character Wizard E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the page with the wizard
    await page.goto('/'); // Adjust based on your app structure
    // You may need to login if required
  });

  test.describe('Creating a New Character', () => {
    test('should create a character with all required fields', async ({ page }) => {
      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Verify wizard is open
      await expect(page.locator('h2:has-text("Novo Personagem")')).toBeVisible();

      // Step 1: Fill basic fields
      await page.fill('input[placeholder*="Nome"]', 'John Doe');
      await page.selectOption('select[id="bookId"]', 'book-123');
      await page.selectOption('select[id="voiceId"]', 'pt-BR-AntonioNeural');

      // Verify Next button is enabled
      const nextButton = page.locator('button:has-text("Próximo")');
      await expect(nextButton).toBeEnabled();

      // Click next
      await nextButton.click();

      // Verify we moved to step 2
      await expect(page.locator('text=Etapa 2 de 7')).toBeVisible();

      // Verify progress bar updated
      const progressBar = page.locator('div[style*="width"]').first();
      await expect(progressBar).toBeVisible();

      // Step 2: Fill identity fields (optional)
      await page.selectOption('select[id="gender"]', 'Masculino');
      await page.fill('input[id="age"]', '30');
      await page.fill('input[id="nationality"]', 'Brasileiro');

      // Go to step 3
      await nextButton.click();
      await expect(page.locator('text=Etapa 3 de 7')).toBeVisible();

      // Skip to final step
      const finalStepButton = page.locator('button[aria-label="Etapa 7"]');
      await finalStepButton.click();
      await expect(page.locator('text=Etapa 7 de 7')).toBeVisible();

      // Verify Confirm button appears
      const confirmButton = page.locator('button:has-text("Criar Personagem")');
      await expect(confirmButton).toBeVisible();

      // Click confirm
      await confirmButton.click();

      // Verify success notification appears
      await expect(
        page.locator('text=Personagem salvo com sucesso')
      ).toBeVisible({
        timeout: 5000,
      });

      // Verify wizard closes
      await expect(
        page.locator('h2:has-text("Novo Personagem")')
      ).not.toBeVisible({
        timeout: 2000,
      });
    });

    test('should show validation error if required fields are missing', async ({
      page,
    }) => {
      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Try to click next without filling fields
      const nextButton = page.locator('button:has-text("Próximo")');
      await expect(nextButton).toBeDisabled();

      // Fill only name
      await page.fill('input[placeholder*="Nome"]', 'John');

      // Still should be disabled (missing bookId and voiceId)
      await expect(nextButton).toBeDisabled();

      // Fill all required fields
      await page.selectOption('select[id="bookId"]', 'book-123');
      await page.selectOption('select[id="voiceId"]', 'pt-BR-AntonioNeural');

      // Now button should be enabled
      await expect(nextButton).toBeEnabled();
    });

    test('should auto-save character draft', async ({ page }) => {
      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Fill basic fields
      await page.fill('input[placeholder*="Nome"]', 'Jane Doe');
      await page.selectOption('select[id="bookId"]', 'book-123');
      await page.selectOption('select[id="voiceId"]', 'pt-BR-FranciscaNeural');

      // Wait for auto-save (3 seconds debounce + notification)
      await expect(
        page.locator('text=Rascunho auto-salvo')
      ).toBeVisible({
        timeout: 5000,
      });

      // Verify notification has timestamp
      await expect(page.locator('text=Última atualização')).toBeVisible();
    });
  });

  test.describe('Editing an Existing Character', () => {
    test('should load character data and allow editing', async ({ page }) => {
      // Navigate to character list or edit page
      // This assumes there's an edit button or link to open the wizard
      await page.click('button:has-text("Editar"):first');

      // Verify wizard shows "Editar Personagem"
      await expect(page.locator('h2:has-text("Editar Personagem")')).toBeVisible();

      // Verify character data is loaded
      const nameInput = page.locator('input[placeholder*="Nome"]');
      const currentValue = await nameInput.inputValue();
      expect(currentValue).toBeTruthy();

      // Modify a field
      await nameInput.fill('Updated Name');

      // Verify auto-save notification appears
      await expect(
        page.locator('text=Alterações auto-salvas')
      ).toBeVisible({
        timeout: 5000,
      });

      // Save changes
      const saveButton = page.locator('button:has-text("Salvar Alterações")');
      await saveButton.click();

      // Verify success
      await expect(
        page.locator('text=Personagem salvo com sucesso')
      ).toBeVisible({
        timeout: 5000,
      });
    });

    test('should allow navigation between steps while editing', async ({
      page,
    }) => {
      // Open edit wizard
      await page.click('button:has-text("Editar"):first');

      // Navigate through steps
      for (let step = 2; step <= 7; step++) {
        const stepButton = page.locator(`button[aria-label="Etapa ${step}"]`);
        await stepButton.click();
        await expect(
          page.locator(`text=Etapa ${step} de 7`)
        ).toBeVisible();
      }

      // Go back to step 1
      const step1Button = page.locator('button[aria-label="Etapa 1"]');
      await step1Button.click();
      await expect(page.locator('text=Etapa 1 de 7')).toBeVisible();
    });
  });

  test.describe('Voice Preview', () => {
    test('should preview voice', async ({ page }) => {
      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Select a voice
      await page.selectOption('select[id="voiceId"]', 'pt-BR-AntonioNeural');

      // Click preview button
      const previewButton = page.locator('button[aria-label="Prévia de voz"]');
      await expect(previewButton).toBeVisible();
      await previewButton.click();

      // Verify spinner appears
      await expect(
        page.locator('button[aria-label="Prévia de voz"] svg.animate-spin')
      ).toBeVisible({
        timeout: 1000,
      });

      // Wait for preview to complete (spinner disappears)
      await expect(
        page.locator('button[aria-label="Prévia de voz"] svg.animate-spin')
      ).not.toBeVisible({
        timeout: 10000,
      });
    });
  });

  test.describe('Form Validation', () => {
    test('should show error for short name', async ({ page }) => {
      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Fill with single character
      await page.fill('input[placeholder*="Nome"]', 'A');

      // Try to proceed
      const nextButton = page.locator('button:has-text("Próximo")');

      // Button should be disabled
      await expect(nextButton).toBeDisabled();
    });

    test('should display inline error messages', async ({ page }) => {
      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Focus and blur name field without filling
      const nameInput = page.locator('input[placeholder*="Nome"]');
      await nameInput.focus();
      await nameInput.blur();

      // Error message should appear
      await expect(page.locator('text=Nome é obrigatório')).toBeVisible();
    });
  });

  test.describe('Navigation and Breadcrumbs', () => {
    test('should navigate back and forth between steps', async ({ page }) => {
      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Fill step 1
      await page.fill('input[placeholder*="Nome"]', 'Test User');
      await page.selectOption('select[id="bookId"]', 'book-123');
      await page.selectOption('select[id="voiceId"]', 'pt-BR-AntonioNeural');

      // Go to step 2
      await page.click('button:has-text("Próximo")');
      await expect(page.locator('text=Etapa 2 de 7')).toBeVisible();

      // Go to step 3
      await page.click('button:has-text("Próximo")');
      await expect(page.locator('text=Etapa 3 de 7')).toBeVisible();

      // Go back to step 2
      await page.click('button:has-text("Voltar")');
      await expect(page.locator('text=Etapa 2 de 7')).toBeVisible();

      // Go back to step 1
      await page.click('button:has-text("Voltar")');
      await expect(page.locator('text=Etapa 1 de 7')).toBeVisible();

      // Back button should be disabled
      const backButton = page.locator('button:has-text("Voltar")');
      await expect(backButton).toBeDisabled();
    });
  });

  test.describe('Close and Resume', () => {
    test('should close wizard and reopen with saved draft', async ({
      page,
    }) => {
      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Fill some data
      await page.fill('input[placeholder*="Nome"]', 'Draft Character');
      await page.selectOption('select[id="bookId"]', 'book-123');
      await page.selectOption('select[id="voiceId"]', 'pt-BR-AntonioNeural');

      // Wait for auto-save
      await expect(
        page.locator('text=Rascunho auto-salvo')
      ).toBeVisible({
        timeout: 5000,
      });

      // Close wizard
      await page.click('button[aria-label="Fechar"]');

      // Verify wizard is closed
      await expect(
        page.locator('h2:has-text("Novo Personagem")')
      ).not.toBeVisible();

      // Reopen wizard
      await page.click('button:has-text("Novo Personagem")');

      // Data should still be there (from localStorage)
      const nameInput = page.locator('input[placeholder*="Nome"]');
      const value = await nameInput.inputValue();
      expect(value).toBe('Draft Character');
    });
  });

  test.describe('Error Handling', () => {
    test('should display API error message', async ({ page }) => {
      // Mock API error response
      await page.route('**/api/characters', (route) => {
        route.abort('failed');
      });

      // Open wizard
      await page.click('button:has-text("Novo Personagem")');

      // Fill and try to save
      await page.fill('input[placeholder*="Nome"]', 'Test');
      await page.selectOption('select[id="bookId"]', 'book-123');
      await page.selectOption('select[id="voiceId"]', 'pt-BR-AntonioNeural');

      // Move to step 2 to trigger save
      await page.click('button:has-text("Próximo")');

      // Error message should appear
      await expect(page.locator('text=/erro|error/i')).toBeVisible({
        timeout: 5000,
      });
    });
  });
});
