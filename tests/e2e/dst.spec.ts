import { test, expect } from '@playwright/test'

// Helper to build URL with query params
function url(path: string, params: Record<string, string | undefined> = {}): string {
  const u = new URL(`http://localhost:5173${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) u.searchParams.set(k, v)
  }
  return u.pathname + u.search
}

// We verify formatting across timezones around DST transitions.
// Using 2021-03-14 (US DST start) and 2021-11-07 (US DST end) for America/New_York.
// For a zone without DST like Asia/Kolkata we expect stable offset behavior.

test.describe('DST formatting', () => {
  test('America/New_York spring forward (2021-03-14)', async ({ page }) => {
    const iso = '2021-03-14T07:30:00.000Z' // 02:30 EST would be skipped; 07:30Z maps to 03:30-04:30 local depending
    const path = url('/en/time-test', { iso, dateOnly: '2021-03-14', tz: 'America/New_York' })
    await page.goto(path)
    // Ensure page loaded
    await expect(page.getByTestId('locale')).toHaveText(/en-US/i)
    // Date-only should render March 14, 2021 in US format (month/day)
    await expect(page.getByTestId('dateOnly-date')).toContainText(/Mar|March/i)
    await expect(page.getByTestId('dateOnly-date')).toContainText(/2021/)
    // DateTime should include time component and not crash around the missing hour
    const dtText = await page.getByTestId('iso-datetime').innerText()
    expect(dtText).toMatch(/2021/) // formatted date contains the year
    expect(dtText).toMatch(/AM|PM|\d{1,2}:\d{2}/) // has time
  })

  test('America/New_York fall back (2021-11-07)', async ({ page }) => {
    const iso = '2021-11-07T05:30:00.000Z' // During fall back window
    const path = url('/en/time-test', { iso, dateOnly: '2021-11-07', tz: 'America/New_York' })
    await page.goto(path)
    await expect(page.getByTestId('locale')).toHaveText(/en-US/i)
    await expect(page.getByTestId('dateOnly-date')).toContainText(/Nov|November/i)
    await expect(page.getByTestId('dateOnly-date')).toContainText(/2021/)
    const dtText = await page.getByTestId('iso-datetime').innerText()
    expect(dtText).toMatch(/2021/)
    expect(dtText).toMatch(/AM|PM|\d{1,2}:\d{2}/)
  })

  test('Asia/Kolkata no DST stability', async ({ page }) => {
    const iso = '2021-03-14T07:30:00.000Z'
    const path = url('/en/time-test', { iso, dateOnly: '2021-03-14', tz: 'Asia/Kolkata' })
    await page.goto(path)
    await expect(page.getByTestId('timezone')).toHaveText('Asia/Kolkata')
    const dtText = await page.getByTestId('iso-datetime').innerText()
    expect(dtText).toMatch(/2021/)
    expect(dtText).toMatch(/\d{1,2}:\d{2}/)
  })
})


