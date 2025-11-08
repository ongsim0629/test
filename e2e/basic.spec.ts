import { test, expect } from '@playwright/test';

/**
 * ✅ 공통 헬퍼: 일정 렌더링 완료까지 대기
 */
async function waitForEventRender(page, text) {
  const list = page.locator('[data-testid="event-list"]');
  await expect(list).toContainText(text, { timeout: 10000 });
}

/**
 * ✅ 겹침 다이얼로그 처리
 */
async function handleOverlapDialog(page) {
  const dialog = page.locator('div[role="dialog"]');
  if (await dialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    const confirm = dialog
      .locator('button:has-text("계속"), button:has-text("진행"), button:has-text("확인")')
      .first();
    if (await confirm.isVisible()) {
      await confirm.click();
      await page.waitForTimeout(500);
    }
  }
}

/**
 * ✅ 일정 생성
 */
async function createEvent(
  page,
  title,
  date = '2025-11-07',
  start = '10:00',
  end = '11:00',
  category = '업무'
) {
  await page.fill('#title', title);
  await page.fill('#date', date);
  await page.fill('#start-time', start);
  await page.fill('#end-time', end);
  await page.selectOption('#category', category);

  const submit = page.locator('[data-testid="event-submit-button"]');
  await submit.click();

  await handleOverlapDialog(page);
  await waitForEventRender(page, title);
}

/**
 * ✅ 각 테스트 전 초기화
 */
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForSelector('[data-testid="event-list"]', { timeout: 10000 });
});

/**
 * ✅ 1. 메인 페이지 로드 확인
 */
test('메인 페이지가 정상 로드된다', async ({ page }) => {
  await expect(page.getByLabel('제목')).toBeVisible();
  await expect(page.getByTestId('event-submit-button')).toBeVisible();
});

/**
 * ✅ 2. 일정 생성
 */
test('일정을 생성할 수 있다', async ({ page }) => {
  const title = `회의-${Date.now()}`;
  await createEvent(page, title);
});

/**
 * ✅ 3. 일정 수정
 */
test('일정을 수정할 수 있다', async ({ page }) => {
  const title = `수정전-${Date.now()}`;
  const newTitle = `수정후-${Date.now()}`;

  await createEvent(page, title);
  const editButton = page.locator('[aria-label*="Edit"], [aria-label*="수정"]').first();
  await editButton.click();

  await page.fill('#title', newTitle);
  await page.locator('[data-testid="event-submit-button"]').click();
  await waitForEventRender(page, newTitle);
});

/**
 * ✅ 4. 일정 삭제
 */
test('일정을 삭제할 수 있다', async ({ page }) => {
  const title = `삭제테스트-${Date.now()}`;
  await createEvent(page, title);

  const deleteButton = page.locator('[aria-label*="Delete"], [aria-label*="삭제"]').first();
  await deleteButton.click();

  await expect(page.locator('[data-testid="event-list"]')).not.toContainText(title, {
    timeout: 10000,
  });
});

/**
 * ✅ 5. 반복 일정 생성
 */
test('반복 일정을 생성할 수 있다', async ({ page }) => {
  const title = `반복-${Date.now()}`;
  await page.fill('#title', title);
  await page.fill('#date', '2025-11-07');
  await page.fill('#start-time', '10:00');
  await page.fill('#end-time', '11:00');

  const checkbox = page.locator('input[type="checkbox"]').first();
  await checkbox.check();

  await page.fill('#repeat-interval', '1');
  await page.fill('#repeat-end-date', '2025-11-30');
  await page.locator('[data-testid="event-submit-button"]').click();

  await waitForEventRender(page, title);
});

/**
 * ✅ 6. 일정 겹침 경고 처리
 */
test('겹치는 시간대 일정 생성 시 경고가 표시되고 계속 진행할 수 있다', async ({ page }) => {
  const base = `회의-${Date.now()}`;
  await createEvent(page, base);

  const overlap = `겹침-${Date.now()}`;
  await page.fill('#title', overlap);
  await page.fill('#start-time', '10:30');
  await page.fill('#end-time', '11:30');
  await page.locator('[data-testid="event-submit-button"]').click();

  const dialog = page.locator('div[role="dialog"]');
  await expect(dialog).toBeVisible({ timeout: 5000 });
  await handleOverlapDialog(page);
  await waitForEventRender(page, overlap);
});

/**
 * ✅ 7. 검색
 */
test('제목으로 일정을 검색할 수 있다', async ({ page }) => {
  const title = `검색-${Date.now()}`;
  await createEvent(page, title);

  await page.fill('#search', '검색');
  await waitForEventRender(page, title);
});

/**
 * ✅ 8. 월간/주간 뷰 전환
 */
test('월간/주간 뷰 전환이 가능하다', async ({ page }) => {
  const select = page.locator('select[aria-label="뷰 타입 선택"]');
  await select.selectOption('week');
  await expect(page.locator('[data-testid="week-view"]')).toBeVisible();
  await select.selectOption('month');
  await expect(page.locator('[data-testid="month-view"]')).toBeVisible();
});
