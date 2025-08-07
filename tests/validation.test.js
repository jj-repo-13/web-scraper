import { test, expect } from '@playwright/test';
import { getArticleData, checkOrder } from '../index.js';

// Verfies each article on Hacker News in the the new tab includes valid data values. Ensures that each extracted field component are properly structured and usable for sorting or display.
test.describe('Hacker News Scraper Validations', () => {
  // Validate article data structure
  test('Each article contains required data', async ({ page }) => {
    await page.goto('https://news.ycombinator.com/newest', {
      waitUntil: 'domcontentloaded',
    });

    const results = await getArticleData(page);

    // Check at least some articles exist
    expect(results.length).toBeGreaterThan(0);

    for (const [i, article] of results.entries()) {
      // Title is present and holds a non-empty value
      expect(article).toHaveProperty('title');
      expect(typeof article.title).toBe('string');
      expect(article.title.length).toBeGreaterThan(0);

      // ISO timestamp matches expected format
      expect(article).toHaveProperty('iso');
	  // Validate formatting (using regex) of iso timestamp, expected pattern: "2025-07-22T08:23:52"
      expect(article.iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);

      // Unix timestamp is a valid numerical value
      expect(article).toHaveProperty('unix');
      expect(Number(article.unix)).not.toBeNaN();
    }
  });

  // Validates the ordering of articles
  test('Articles are sorted newest to oldest', async ({ page }) => {
    await page.goto('https://news.ycombinator.com/newest', {
      waitUntil: 'domcontentloaded',
    });
    
	// Calls on custom function to extract data values for each article row
    const results = await getArticleData(page);
	// Extracts the first 100 articles
    const subset = results.slice(0, 100);
	// Calls on custom function to check for correct ordering, if not return false.
    const sorted = checkOrder(subset);

    // Assert that sorting is descending
    expect(sorted).toBe(true);
  });
});
