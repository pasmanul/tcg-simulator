import { test, expect } from '@playwright/test'

// ---- BoardPage (index.html) ----

test('BoardPage: ページが正常に読み込まれる', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/')
  // React がレンダリングするまで待つ
  await page.waitForLoadState('networkidle')
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
})

test('BoardPage: HUDボタン（DECK・HAND）が表示される', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  // BoardHud に DECK ボタンと HAND ボタンがある
  await expect(page.getByRole('button', { name: /DECK/i })).toBeVisible()
  await expect(page.getByRole('button', { name: /HAND/i })).toBeVisible()
})

test('BoardPage: DECKボタンを押すとデッキパネルが開く', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: /DECK/i }).click()
  // デッキパネルが表示される（DeckPage が重なって表示される）
  await expect(page.locator('text=デッキ内容')).toBeVisible({ timeout: 3000 })
})

// ---- DeckPage (deck.html) ----

test('DeckPage: ページが正常に読み込まれる', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
})

test('DeckPage: DeckHud が表示される（SAVE・LOAD CARDS ボタン等）', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  // DeckHud に LOAD CARDS ボタンと SAVE ボタンがある
  await expect(page.getByRole('button', { name: 'LOAD CARDS' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'SAVE' })).toBeVisible()
})

test('DeckPage: 右パネルに「デッキ内容」ヘッダーが表示される', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  await expect(page.locator('text=デッキ内容')).toBeVisible()
})

test('DeckPage: FilterBar が表示される（検索フィールド）', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  // FilterBar には検索テキストボックスがある
  await expect(page.getByPlaceholder(/search|検索|カード名/i)).toBeVisible()
})

test('DeckPage: SetupDialog が LOAD CARDS ボタンで開く', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'LOAD CARDS' }).click()
  // SetupDialog に "CARD LIBRARY" タイトルが表示される
  await expect(page.locator('text=CARD LIBRARY')).toBeVisible({ timeout: 3000 })
})

test('DeckPage: SetupDialog に3つのボタンがある', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'LOAD CARDS' }).click()
  await expect(page.locator('text=CARD LIBRARY')).toBeVisible({ timeout: 3000 })
  await expect(page.getByRole('button', { name: /フォルダを選択/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /前回のフォルダを復元/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /新規セットアップ/ })).toBeVisible()
})

test('DeckPage: SetupDialog を閉じるボタンで閉じられる', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'LOAD CARDS' }).click()
  await expect(page.locator('text=CARD LIBRARY')).toBeVisible({ timeout: 3000 })
  await page.getByRole('button', { name: /閉じる/ }).click()
  await expect(page.locator('text=CARD LIBRARY')).not.toBeVisible({ timeout: 3000 })
})

// ---- HandPage (hand.html) ----

test('HandPage: ページが正常に読み込まれる', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/hand.html')
  await page.waitForLoadState('networkidle')
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
})
