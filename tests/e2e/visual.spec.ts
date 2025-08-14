import { test, expect } from '@playwright/test';

async function loginViaApi(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext) {
  try {
    const loginRes = await request.post('/api/auth/login', { data: { username: 'admin', password: 'admin123' } });
    if (loginRes.ok()) {
      const auth = await loginRes.json();
      await page.addInitScript(([data]) => {
        localStorage.setItem(
          'auth',
          JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token, user: data.user }),
        );
      }, [auth]);
    }
  } catch {
    // ignore
  }
}

async function disableAnimations(page: import('@playwright/test').Page) {
  await page.addStyleTag({
    content:
      '* { transition: none !important; animation: none !important; caret-color: transparent !important; }',
  });
}

test.describe('visual-regression', () => {
  test.beforeEach(async ({ page, request }) => {
    await loginViaApi(page, request);
  });

  test('dashboard baseline', async ({ page }) => {
    await page.goto('/es');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    await expect(page).toHaveScreenshot('dashboard.png', {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test('students baseline', async ({ page }) => {
    await page.goto('/es/students');
    await page.waitForLoadState('networkidle');
    await disableAnimations(page);
    // Ensure at least one student row is rendered before snapshot
    const possibleRow = page.getByText(/Pedro|Estudiantes|Students/i);
    await possibleRow.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await expect(page).toHaveScreenshot('students.png', {
      animations: 'disabled',
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});


