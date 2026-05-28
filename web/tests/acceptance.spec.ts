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
  await expect(page.getByText('POOL', { exact: true })).toBeVisible({ timeout: 3000 })
  await expect(page.getByText('DECK', { exact: true })).toBeVisible({ timeout: 3000 })
})

test('BoardPage: ダミーデッキ初期配置のゾーン枚数が表示される', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await expect(page.getByTestId('zone-deck-count')).toHaveText('30')
  await expect(page.getByTestId('zone-hand-count')).toHaveText('5')
  await expect(page.getByTestId('zone-shield-count')).toHaveText('5')
})

test('BoardPage: Draw で山札から手札へ1枚移動する', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Draw' }).click()
  await expect(page.getByTestId('zone-deck-count')).toHaveText('29')
  await expect(page.getByTestId('zone-hand-count')).toHaveText('6')
})

test('BoardPage: Init Field で初期枚数に戻る', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Draw' }).click()
  await expect(page.getByTestId('zone-hand-count')).toHaveText('6')
  await page.getByRole('button', { name: 'Init Field' }).click()
  await expect(page.getByTestId('zone-deck-count')).toHaveText('30')
  await expect(page.getByTestId('zone-hand-count')).toHaveText('5')
  await expect(page.getByTestId('zone-shield-count')).toHaveText('5')
})

test('BoardPage: 山札右クリックからサーチダイアログが開く', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByTestId('zone-deck-pile-top').click({ button: 'right' })
  await expect(page.getByText('サーチ', { exact: true })).toBeVisible()
  await page.getByText('サーチ', { exact: true }).click()
  await expect(page.getByText('DECK SEARCH')).toBeVisible()
  await expect(page.getByText(/山札:\s*30枚/)).toBeVisible()
})

test('BoardPage: Save/Load ダイアログが JSON 保存・読込UIを表示する', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'Save/Load' }).click()
  await expect(page.getByText('SAVE / LOAD')).toBeVisible()
  await expect(page.getByText('※ セーブデータは JSON ファイルとしてダウンロードします')).toBeVisible()
  await page.getByRole('button', { name: 'LOAD', exact: true }).click()
  await expect(page.getByText('保存済み JSON ファイルを選択して読み込みます。')).toBeVisible()
})

// ---- DeckPage (deck.html) ----

test('DeckPage: ページが正常に読み込まれる', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
})

test('DeckPage: DeckHud が表示される（SAVE・LOAD POOL ボタン等）', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  // DeckHud に LOAD POOL ボタンと SAVE ボタンがある
  await expect(page.getByRole('button', { name: 'LOAD POOL' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'SAVE' })).toBeVisible()
})

test('DeckPage: 右パネルに DECK エリアが表示される', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  await expect(page.getByText('DECK', { exact: true })).toBeVisible()
  await expect(page.getByText('デッキなし', { exact: true })).toBeVisible()
})

test('DeckPage: FilterBar が表示される（検索フィールド）', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  // FilterBar には検索テキストボックスがある
  await expect(page.getByPlaceholder(/search|検索|カード名/i)).toBeVisible()
})

test('DeckPage: GameLoadDialog が LOAD POOL ボタンで開く', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'LOAD POOL' }).click()
  await expect(page.locator('text=GAME PROFILE')).toBeVisible({ timeout: 3000 })
})

test('DeckPage: GameLoadDialog に3つのボタンがある', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'LOAD POOL' }).click()
  await expect(page.locator('text=GAME PROFILE')).toBeVisible({ timeout: 3000 })
  await expect(page.getByRole('button', { name: /既存プロファイルを開く/ })).toBeVisible()
  await expect(page.getByRole('button', { name: /新規ゲームを作成/ })).toBeVisible()
  await expect(page.getByText('閉じる', { exact: true })).toBeVisible()
})

test('DeckPage: GameLoadDialog を閉じるボタンで閉じられる', async ({ page }) => {
  await page.goto('/deck.html')
  await page.waitForLoadState('networkidle')
  await page.getByRole('button', { name: 'LOAD POOL' }).click()
  await expect(page.locator('text=GAME PROFILE')).toBeVisible({ timeout: 3000 })
  await page.getByText('閉じる', { exact: true }).click()
  await expect(page.locator('text=GAME PROFILE')).not.toBeVisible({ timeout: 3000 })
})

// ---- HandPage (hand.html) ----

test('HandPage: ページが正常に読み込まれる', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', e => errors.push(e.message))
  await page.goto('/hand.html')
  await page.waitForLoadState('networkidle')
  expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0)
})
