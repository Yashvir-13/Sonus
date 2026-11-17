import { test, expect, type Page } from '@playwright/test'

function attachErrorCollectors(page: Page) {
  const pageErrors: string[] = []
  const fatalConsoleErrors: string[] = []
  const apiServerErrors: string[] = []

  page.on('pageerror', (err) => {
    pageErrors.push(err.message)
  })

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text()
      // Ignore harmless offline/HMR/Clerk dev noise
      if (
        text.includes('WebSocket') ||
        text.includes('favicon.ico') ||
        text.includes('ERR_NAME_NOT_RESOLVED')
      ) {
        return
      }
      fatalConsoleErrors.push(text)
    }
  })

  page.on('response', (res) => {
    if (res.url().includes('/api/') && res.status() >= 500) {
      apiServerErrors.push(`${res.status()} ${res.url()}`)
    }
  })

  return { pageErrors, fatalConsoleErrors, apiServerErrors }
}

async function assertNoHorizontalOverflow(page: Page) {
  const dims = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }))
  expect(dims.scrollWidth).toBeLessThanOrEqual(dims.innerWidth)
}

test.describe('SONUS Immersive Frontend & Studio Navigation', () => {
  test('Desktop 1440x900: single-room 5-act zoom/pan camera, interactive preview, theme toggle & full workspace flow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    const { pageErrors, fatalConsoleErrors, apiServerErrors } = attachErrorCollectors(page)

    await page.goto('/', { waitUntil: 'networkidle' })

    // Verify expanding headline & no fake telemetry or DSP/PCM jargon
    await expect(page.getByTestId('expanding-wordmark')).toBeVisible()
    await expect(page.getByTestId('volumetric-smoke-canvas')).toBeVisible()
    const bodyText = await page.evaluate(() => document.body.innerText)
    expect(bodyText).not.toContain('CAM 07')
    expect(bodyText).not.toContain('SPLINE')
    expect(bodyText).not.toContain('22.05 kHz Mono PCM')
    expect(bodyText).not.toContain('Needleman-Wunsch')
    expect(bodyText).not.toContain('B=0.0004')

    // Verify unified single-room studio photograph loaded properly
    const imgChecks = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'))
      return imgs.map((img) => ({
        alt: img.alt,
        complete: img.complete,
        naturalWidth: img.naturalWidth,
      }))
    })
    expect(imgChecks.length).toBeGreaterThanOrEqual(1)
    for (const img of imgChecks) {
      expect(img.complete, `Image "${img.alt}" finished loading`).toBe(true)
      expect(img.naturalWidth, `Image "${img.alt}" has positive naturalWidth`).toBeGreaterThan(0)
    }

    await assertNoHorizontalOverflow(page)

    // Scroll through landing stage acts via waypoint navigation and verify single-room camera transforms
    const stageStateInitial = await page
      .getByTestId('cinematic-camera-stage')
      .getAttribute('data-act')
    expect(stageStateInitial).toBe('0')

    await page.getByTestId('waypoint-act2').click()
    await expect(page.getByTestId('cinematic-camera-stage')).toHaveAttribute('data-act', '1')
    await expect(page.getByTestId('landing-act-2')).toHaveCSS('opacity', '1')
    await expect(page.getByTestId('act2-voicing-preview')).toBeVisible()
    await page.getByTestId('act2-instrument-guitar').click()
    await expect(page.getByTestId('active-voicing-display')).toBeVisible()

    await page.getByTestId('waypoint-act3').click()
    await expect(page.getByTestId('cinematic-camera-stage')).toHaveAttribute('data-act', '2')
    await expect(page.getByTestId('act3-bar-feedback')).toBeVisible()
    await expect(page.getByTestId('world-sheet-pin')).toBeVisible()

    // Confirm camera zooms deeper onto the center music stand at Act 3 without CSS blur
    const act3CameraStyle = await page.getByTestId('studio-room-camera').evaluate((el) => {
      const style = window.getComputedStyle(el)
      return { transform: style.transform, filter: style.filter }
    })
    expect(act3CameraStyle.transform).not.toBe('none')
    expect(act3CameraStyle.filter === 'none' || !act3CameraStyle.filter.includes('blur')).toBe(
      true
    )

    await page.getByTestId('waypoint-act5').click()
    await expect(page.getByTestId('cinematic-camera-stage')).toHaveAttribute('data-act', '4')

    // Test Light / Dark theme toggle
    const initialDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    await page.getByTestId('theme-toggle-button').first().click()
    const toggledDark = await page.evaluate(() =>
      document.documentElement.classList.contains('dark')
    )
    expect(toggledDark).toBe(!initialDark)
    // Toggle back to initial
    await page.getByTestId('theme-toggle-button').first().click()

    // Enter Practice Studio from landing CTA
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(250)
    await page.getByRole('button', { name: /Enter Practice Studio/i }).first().click()

    await expect(page.getByTestId('global-navigation-header')).toBeVisible()
    await expect(page.getByTestId('practice-studio-cockpit')).toBeVisible()
    await assertNoHorizontalOverflow(page)

    // Open & close repertoire drawer
    await page.getByTestId('open-repertoire-drawer').click()
    await expect(page.getByTestId('codex-repertoire-drawer')).toHaveAttribute(
      'aria-hidden',
      'false'
    )
    await page.getByTestId('repertoire-drawer-close').click()
    await expect(page.getByTestId('codex-repertoire-drawer')).toHaveAttribute(
      'aria-hidden',
      'true'
    )

    // Navigate across studio tools via shared-layout header tabs
    await page.getByTestId('nav-pill-theory').click()
    await expect(page.getByTestId('chords-scales-page')).toBeVisible()
    await page.getByTestId('theory-root-A').click()
    await page.getByTestId('theory-cat-sevenths').click()

    await page.getByTestId('nav-pill-tuner').click()
    await expect(page.getByTestId('guitar-tuner-page')).toBeVisible()
    await page.getByTestId('tuner-peg-3').click()

    await page.getByTestId('nav-pill-progress').click()
    await expect(page.getByTestId('progress-dashboard-page')).toBeVisible()

    await page.getByTestId('nav-pill-community').click()
    await expect(page.getByTestId('peer-comparison-page')).toBeVisible()
    await expect(page.getByTestId('dist-timing')).toBeVisible()

    // Open Settings Modal and switch tabs cleanly
    await page.getByTestId('open-settings-modal-btn').click()
    await expect(page.getByTestId('settings-modal-backdrop')).toBeVisible()
    await page.getByTestId('settings-tab-studio').click()
    await page.getByTestId('settings-tab-audio').click()
    await page.getByTestId('close-settings-modal-btn').click()
    await expect(page.getByTestId('settings-modal-backdrop')).toHaveCount(0)

    expect(pageErrors).toEqual([])
    expect(fatalConsoleErrors).toEqual([])
    expect(apiServerErrors).toEqual([])
  })

  test('Tablet 768x1024: responsive layout without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    const { pageErrors, fatalConsoleErrors } = attachErrorCollectors(page)

    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('expanding-wordmark')).toBeVisible()
    await assertNoHorizontalOverflow(page)

    await page.getByRole('button', { name: /Enter Practice Studio/i }).first().click()
    await expect(page.getByTestId('practice-studio-cockpit')).toBeVisible()
    await assertNoHorizontalOverflow(page)

    expect(pageErrors).toEqual([])
    expect(fatalConsoleErrors).toEqual([])
  })

  test('Mobile 390x844: landing and studio cockpit remain readable with zero overflow', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    const { pageErrors, fatalConsoleErrors } = attachErrorCollectors(page)

    await page.goto('/', { waitUntil: 'networkidle' })
    await expect(page.getByTestId('expanding-wordmark')).toBeVisible()
    await assertNoHorizontalOverflow(page)

    await page.getByRole('button', { name: /Enter Practice Studio/i }).first().click()
    await expect(page.getByTestId('practice-studio-cockpit')).toBeVisible()
    await assertNoHorizontalOverflow(page)

    expect(pageErrors).toEqual([])
    expect(fatalConsoleErrors).toEqual([])
  })
})
