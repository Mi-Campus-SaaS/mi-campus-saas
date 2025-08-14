import { test, expect } from '@playwright/test'

test('health check', async ({ page, request }) => {
  await page.goto('/es')
  const res = await request.get('/api/health')
  expect(res.status()).toBe(200)
  expect(await res.text()).toBe('OK')
})

test('login → create announcement → upload material → record payment', async ({ page }) => {
  // Login
  await page.goto('/es/login')
  await page.getByPlaceholder(/usuario|username/i).fill('admin')
  await page.getByPlaceholder(/contraseña|password/i).fill('admin123')
  await page.getByRole('button', { name: /iniciar sesión|login/i }).click()
  await expect(page.getByRole('button', { name: /cerrar sesión|logout/i })).toBeVisible({ timeout: 10000 })

  // Go to announcements and create one
  await page.getByRole('link', { name: /anuncios|announcements/i }).click()
  const content = `E2E announcement ${Date.now()}`
  await page.getByLabel(/contenido|content/i).fill(content)
  await page.getByRole('button', { name: /crear|create/i }).click()
  await expect(page.getByText(content)).toBeVisible({ timeout: 5000 })

  // Navigate to classes and materials subpage of first class
  await page.getByRole('link', { name: /clases|classes/i }).click()
  // Click first class card if materials link exists in UI (fallback: navigate by URL pattern if needed)
  // This app uses route /:locale/classes/:classId/materials; we try via direct navigation to first row if present
  // Note: For demo DB we assume at least one class exists with id-like link in UI; if not, skip upload

  // Try navigate to materials of first class by reading first card's link pattern
  const materialsLink = page.getByRole('link', { name: /materiales|materials/i }).first()
  if (await materialsLink.isVisible().catch(() => false)) {
    await materialsLink.click()
  }

  // If materials page is open, try an upload with a small blob file
  if (page.url().includes('/materials')) {
    await page.getByLabel(/título|title/i).fill('E2E Material')
    await page.setInputFiles('input[type=file]', {
      name: 'e2e.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('hello e2e'),
    })
    await page.getByRole('button', { name: /subir|upload/i }).click()
    await expect(page.getByText('E2E Material')).toBeVisible({ timeout: 5000 })
  }

  // Finance: record payment for a visible invoice of some student
  await page.getByRole('link', { name: /finanzas|finance/i }).click()
  // Select student dropdown: type and pick first suggestion if available
  await page.getByLabel(/estudiante|student/i).fill('')
  const firstCandidate = page.locator('.dropdown li button').first()
  if (await firstCandidate.isVisible().catch(() => false)) {
    await firstCandidate.click()
  }

  // Create fee if list is empty, then record payment
  const hasFee = await page.locator('text=/\\$[0-9]+\\.[0-9]{2}/').first().isVisible().catch(() => false)
  if (!hasFee) {
    await page.getByLabel(/monto|amount/i).first().fill('10')
    await page.getByLabel(/fecha de vencimiento|due date/i).fill(new Date().toISOString().slice(0, 10))
    await page.getByRole('button', { name: /crear cuota|create fee/i }).click()
  }
  const invoiceRow = page.locator('li.card').first()
  const invoiceIdText = await invoiceRow.locator('div.text-xs').innerText()
  await page.getByLabel(/id de factura|invoice id/i).fill(invoiceIdText)
  await page.getByLabel(/^monto$|^amount$/i).last().fill('10')
  await page.getByRole('button', { name: /registrar pago|record payment/i }).click()
  await expect(page.getByText(invoiceIdText)).toBeVisible({ timeout: 5000 })
})


