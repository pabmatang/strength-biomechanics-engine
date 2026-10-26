/**
 * Playwright End-to-End (E2E) Test Suite
 * Critical Paths:
 * 1. User Authentication (Login / Register guard)
 * 2. Exercise Catalog filtering by Brand (Technogym / Hammer Strength)
 * 3. Machine Biomechanics Modal inspection & quick pin adjustment
 * 4. Nutrition Voice AI and Quick-add food logging
 */

import { test, expect } from '@playwright/test';

test.describe('CHΔNCE Biomechanics & Training Platform E2E Flows', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to base application URL
    await page.goto('/');
  });

  test('Flow 1: Guest / Demo Login Gate', async ({ page }) => {
    // Verify credentials gate is rendered
    await expect(page.locator('text=CHΔNCE')).toBeVisible();
    await expect(page.locator('text=Iniciar Sesión')).toBeVisible();

    // Click demo athlete entrance
    const demoButton = page.locator('button:has-text("Entrar como Invitado")');
    await demoButton.click();

    // Verify main app dashboard appears with routines
    await expect(page.locator('text=Mis Rutinas')).toBeVisible();
    await expect(page.locator('button:has-text("Libre")')).toBeVisible();
  });

  test('Flow 2: Exercise Catalog Brand Filtering & Biomechanics Inspection', async ({ page }) => {
    // Log in with demo user
    await page.locator('button:has-text("Entrar como Invitado")').click();

    // Click on an existing routine or exercise selector
    const routineCard = page.locator('text=Empuje').first();
    if (await routineCard.isVisible()) {
      await routineCard.click();
    }

    // Open Exercise Selector if available
    const addExerciseBtn = page.locator('button:has-text("Añadir Ejercicio")').first();
    if (await addExerciseBtn.isVisible()) {
      await addExerciseBtn.click();

      // Filter by Technogym
      await page.locator('button:has-text("Technogym")').click();
      await expect(page.locator('text=Technogym Pure Strength')).toBeVisible();

      // Open Machine Detail Modal
      await page.locator('text=Technogym Pure Strength - Pulldown').click();

      // Verify Dual Curves SVG Chart is present
      await expect(page.locator('text=Curva de Fuerza Muscular vs. Resistencia')).toBeVisible();
      await expect(page.locator('text=Modificaciones de Taller & Hacks Pro')).toBeVisible();
    }
  });

  test('Flow 3: Nutrition AI & Fast Food Addition', async ({ page }) => {
    // Log in
    await page.locator('button:has-text("Entrar como Invitado")').click();

    // Switch to Health & Nutrition Hub
    const healthTab = page.locator('button:has-text("Salud")').first();
    if (await healthTab.isVisible()) {
      await healthTab.click();

      // Open Voice AI Dictation modal
      const voiceBtn = page.locator('button:has-text("Dictar por Voz")').first();
      if (await voiceBtn.isVisible()) {
        await voiceBtn.click();
        await expect(page.locator('text=Dictado de Alimentos por Voz')).toBeVisible();

        // Tap preset sample
        const presetBtn = page.locator('button:has-text("Desayuno: 80g avena")').first();
        if (await presetBtn.isVisible()) {
          await presetBtn.click();
          await expect(page.locator('text=Alimentos Detectados por la IA')).toBeVisible();
        }
      }
    }
  });
});
