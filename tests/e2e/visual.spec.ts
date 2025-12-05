import { test, expect, Page, APIRequestContext } from '@playwright/test';

const SCREENSHOT_OPTIONS = {
  animations: 'disabled' as const,
  fullPage: true,
  maxDiffPixelRatio: 0.02,
};

async function loginViaApi(page: Page, request: APIRequestContext): Promise<void> {
  try {
    const loginRes = await request.post('/api/auth/login', {
      data: { username: 'admin', password: 'admin123' },
    });
    if (loginRes.ok()) {
      const auth = await loginRes.json();
      await page.addInitScript(([data]) => {
        localStorage.setItem(
          'auth',
          JSON.stringify({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
          }),
        );
      }, [auth]);
    }
  } catch {
    // ignore - will test unauthenticated state
  }
}

async function disableAnimations(page: Page): Promise<void> {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        transition: none !important;
        animation: none !important;
        caret-color: transparent !important;
      }
    `,
  });
}

async function waitForPageStable(
  page: Page,
  options: { waitForSelector?: string; timeout?: number } = {},
): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await disableAnimations(page);

  if (options.waitForSelector) {
    await page.waitForSelector(options.waitForSelector, { timeout: options.timeout || 15000 }).catch(() => {});
  }

  try {
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
  } catch {
    // Ignore - pages with SSE/polling never reach networkidle
  }

  await page.waitForTimeout(2000);
}

test.describe('visual-regression', () => {
  test.describe('public pages', () => {
    test('login page baseline', async ({ page }) => {
      await page.goto('/es/login');
      await waitForPageStable(page, { waitForSelector: 'form, button', timeout: 10000 });
      await expect(page).toHaveScreenshot('login.png', SCREENSHOT_OPTIONS);
    });
  });

  test.describe('authenticated pages', () => {
    test.beforeEach(async ({ page, request }) => {
      await loginViaApi(page, request);
    });

    test('dashboard baseline', async ({ page }) => {
      await page.goto('/es');
      await waitForPageStable(page, { waitForSelector: 'h1', timeout: 15000 });
      await expect(page).toHaveScreenshot('dashboard.png', SCREENSHOT_OPTIONS);
    });

    test('students baseline', async ({ page }) => {
      await page.goto('/es/students');
      await page.waitForLoadState('domcontentloaded');
      await disableAnimations(page);

      await page.waitForSelector('h1', { timeout: 15000 }).catch(() => {});

      const container = page.locator('.vlist-outer');
      const skeletons = page.locator('.space-y-3');

      await Promise.race([
        container.waitFor({ state: 'visible', timeout: 15000 }),
        skeletons.waitFor({ state: 'visible', timeout: 15000 }),
      ]).catch(() => {});

      if (await container.isVisible()) {
        await page.locator('.vlist-item').first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
      }

      try {
        await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {});
      } catch {
        // Ignore
      }

      await page.waitForTimeout(2000);

      await expect(page).toHaveScreenshot('students.png', SCREENSHOT_OPTIONS);
    });

    test('classes baseline', async ({ page }) => {
      await page.goto('/es/classes');
      await waitForPageStable(page, { waitForSelector: 'h1', timeout: 15000 });
      await expect(page).toHaveScreenshot('classes.png', SCREENSHOT_OPTIONS);
    });

    test('schedule baseline', async ({ page }) => {
      await page.goto('/es/schedule');
      await waitForPageStable(page, { waitForSelector: 'h1', timeout: 15000 });
      await expect(page).toHaveScreenshot('schedule.png', SCREENSHOT_OPTIONS);
    });

    test('announcements baseline', async ({ page }) => {
      await page.goto('/es/announcements');
      await waitForPageStable(page, { waitForSelector: 'h1', timeout: 15000 });
      await expect(page).toHaveScreenshot('announcements.png', SCREENSHOT_OPTIONS);
    });

    test('finance baseline', async ({ page }) => {
      await page.goto('/es/finance');
      await waitForPageStable(page, { waitForSelector: 'h1', timeout: 15000 });
      await expect(page).toHaveScreenshot('finance.png', SCREENSHOT_OPTIONS);
    });
  });
});


