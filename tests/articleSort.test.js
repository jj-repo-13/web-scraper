import { test, expect } from '@playwright/test';

// This test confirms that the articles on Hacker News' "newest" tab are sorted in descending order (newest to oldest)
test('Hacker News articles are sorted from newest to oldest', async ({ page }) => {
  await page.goto('https://news.ycombinator.com/newest', {
    waitUntil: 'domcontentloaded',
  });

  // Extract all span.age elements containing timestamps
  const timestamps = await page.locator('span.age').evaluateAll(spans =>
    spans
      .map(span => span.getAttribute('title'))       // Example: "2025-07-22T08:23:52 1753172632"
      .filter(Boolean)                               // Remove null values
      .map(t => {
        const parts = t.split(' ');
        if (parts.length !== 2) throw new Error(`Unexpected timestamp format: ${t}`);
        const unix = Number(parts[1]);
        if (isNaN(unix)) throw new Error(`Invalid UNIX timestamp: ${t}`);
        return unix;
      })
  );

  // Basic length check
  expect(timestamps.length).toBeGreaterThan(10); // Expect at least 10 timestamps

  // Assert descending order
  for (let i = 1; i < timestamps.length; i++) {
    const current = timestamps[i];
    const previous = timestamps[i - 1];

    expect(current).toBeLessThanOrEqual(previous); // Check for descending
    expect(typeof current).toBe('number');         // Each must be number
    expect(current).toBeGreaterThan(0);            // timestamps should be positive
  }

  // Redundant sort check to guarantee correctness
  const sorted = [...timestamps].slice(0, 100).every((val, i, arr) =>
    i === 0 || val <= arr[i - 1]
  );
  expect(sorted).toBe(true); // Final redundancy check
});
