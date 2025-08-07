// Initiates and automates the chromium browser envioronment
import { chromium } from 'playwright'; 
// Adding colors to the output in the terminal, enhancing readibility
import chalk from 'chalk'; 
// Used for in-code validations, if any logic breaks the script will be halted with an error
import assert from 'assert'; 

// The max number of articles to parse 
const MAX_ARTICLES = 100; 
// Setting number of retry attempts 
const MAX_RETRIES = 3; 

/** 
 * Extracts the title of articles, ISO timestamps, and Unix timestamps from each article row
 * @param {import('playwright').Page} page : Playwright page instance  
 * @returns {Promise<Array<{ title: string, iso: string, unix: string}>>} Array of articles
*/
async function getArticleData(page) {
  // Wait for the table rows
  await page.waitForSelector('tr.athing', { timeout: 10000 }); 

  // Evaluating article rows
  const results = await page.locator('tr.athing').evaluateAll(rows =>
    rows.map(row => {
      const titleEl = row.querySelector('.titleline a');  // Extracting article title link
      const ageSpan = row.nextElementSibling?.querySelector('span.age');  // Extracting timestamp from the next row

      if (!titleEl || !ageSpan) return null; // Skip if either attributes are missing

      const titleAttr = ageSpan.getAttribute('title'); // Example: "2025-07-22T08:23:52 1753172632"
      if (!titleAttr) return null;

      const [iso, unix] = titleAttr.split(' ');  // Split title into ISO and Unix format

      return {
        title: titleEl.innerText.trim(),
        iso,
        unix
      };
    }).filter(Boolean) // Remove null entries
  );
  assert(results.every(obj => 'title' in obj && 'iso' in obj && 'unix' in obj), "Some articles missing required fields."); // Confirm all required fields exist

  // Assertions to validate structure
  assert(results.length > 0, "No valid timestamp rows extracted");  // Ensure at least one valid article was found, else throw error 
  results.forEach((r, idx) => {
    assert(typeof r.title === 'string' && r.title.trim().length > 0, `Invalid title at index ${idx}`);  // Validate each title
    assert(typeof r.iso === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(r.iso), `Invalid ISO at index ${idx}: ${r.iso}`);  // Confirm ISO format is in proper (YYYY-MM_DDTHH:MM:SS) structure
    assert(typeof r.unix === 'string' && /^\d+$/.test(r.unix), `Invalid UNIX at index ${idx}: ${r.unix}`);  // Confirm Unix is a numeric string
  });

  return results;
}

/**
 * Checks to see that articles are sorted correctly.
 * @param {Array<{unix: string}>} timestamps : List of articles with Unix timestamps.
 * @return {boolean} True if descending, else false.
 */
function checkOrder(timestamps) { 
  assert(timestamps.length > 1, "Not enough timestamps to compare order."); // Confirm each UNIX value is a positive integer
  
  for (let i = 1; i < timestamps.length; i++) {
	// Checking to see if the value is present
    assert(timestamps[i] && timestamps[i - 1], `Missing timestamp at index ${i}`);  // Confirm curr and prev timestamps exist, else throw error with specified index.
	assert(/^\d+$/.test(timestamps[i].unix), `Invalid UNIX at index ${i}: ${timestamps[i].unix}`);  // Confirm Unix timestamp is made up of digits, else throw error. 
    assert(Number(timestamps[i].unix) > 0, `Non-positive UNIX value at index ${i}`);  // Confirm Unix value is non negative, else throw error. 
	
	// If current is more recent than previous, it's not in descending order
    if (Number(timestamps[i].unix) > Number(timestamps[i - 1].unix)) {
      return false;
    }
  }
  return true;
}

/**
 * Logs as formatted table.
 * @param {Array<{title: string, iso: string, unix: string}>} timestamps : Representing article data
 * @param {number} count : The number of articles to display.
 */
function displayTable(timestamps, count = 10) {
  assert(Array.isArray(timestamps), "Timestamps input is not an array.");
  assert(timestamps.length > 0, "No timestamps provided for display.");
  // Holds timestamp differences
  const deltas = [];
  // Determine column width based on longest title
  const maxTitleLength = Math.max(...timestamps.map(t => t.title.trim().length), "Article Name".length);
  // Pad column labels
  const format = (label, width) => label.padEnd(width);

  // Formatting Table Header
  console.log(`\nChecking first ${count} timestamps:\n`);
  
  // Print table headers
  console.log(
    `${format("Index", 5)} | ${format("Article Name", maxTitleLength)} | ${format("ISO Timestamp", 20)} | ${format("Unix Timestamp", 14)} | ${format("Unix Delta in Seconds", 20)}`
  );
   
  // Build consistent separator row using repeat()
  const separatorRow =
    `${'-'.repeat(5)} | ` +  // Index column
    `${'-'.repeat(maxTitleLength)} | ` +  // Article title column
    `${'-'.repeat(21)}| ` +  // ISO column
    `${'-'.repeat(15)}| ` +  // Unix column
    `${'-'.repeat(16)}`;  // Delta column

  console.log(separatorRow);
  
  // Loop through selected number of articles
  for (let i = 0; i < Math.min(count, timestamps.length); i++) {
    const { iso, unix, title } = timestamps[i];  // unpacking values
    const epoch = Number(unix); // Convert unix timestamp to a numeric value
    let delta = chalk.gray("—"); // Placeholder for initial delta value.

    if (i > 0) {
      const prev = Number(timestamps[i - 1].unix); // Previous article timestamp
      const diff = epoch - prev; // Delta in seconds
	  assert(Number.isFinite(diff), `Non-valid delta at row ${i}`);  // Checks the time difference is a valid number, else throw error
      assert(Number.isInteger(diff), `Non-integer delta at row ${i}`);  // Confirm delta is value of int
      deltas.push(diff); // Add the difference into delta to computing average
      
	  // Style delta based on value, red if newer meaning error, Green if slightly older, Yellow if no changes, highlights with yellow if very old
	  delta =
        diff > 0
          ? chalk.red(`+${diff}`) // Should never be displayed in descending sort
          : diff < -300
          ? chalk.bgYellow.black(`${diff}`) // Signifies large gap 
          : diff < 0
          ? chalk.green(`${diff}`) // Normal descending order
          : chalk.yellow("0"); // Same timestamps
    }
    
	// Print row with dynamic spacing and proper formatting
    console.log(
      `${String(i + 1).padEnd(5)} | ${title.padEnd(maxTitleLength)} | ${format(iso, 19)}  | ${String(unix).padEnd(14)} | ${delta}`
    );
  }
  
  // Compute and display average delta
  if (deltas.length) {
    const avg = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    assert(!isNaN(avg), "Delta average is not a number"); // Validate avg is a numerical value before output
    console.log(`\nAvg gap between posts: ${chalk.cyan(Math.abs(avg.toFixed(1)))} seconds`);
  }
}

/** 
 * Main function to extract, validate, and log the article data in Hacker News. 
 * Uses Playwright to simulate user navigating to Hacker News.
 */
async function sortHackerNewsArticles() {
  let browser; // Declare browser variable

  try {
	// Run browser without GUI interface
    console.log("Launching Chromium...");
    browser = await chromium.launch();
	
	// Create new browser context
    const context = await browser.newContext();
    // Open a new page
    const page = await context.newPage(); // Wait for DOM to be ready

    console.log("Navigating to new tab in Hacker News...");
    await page.goto('https://news.ycombinator.com/newest', {
      waitUntil: 'domcontentloaded',
    });

    const timestamps = []; // Collect articles from pages

    // Loop until the number of MAX_Articles are gathered
    while (timestamps.length < MAX_ARTICLES) {
	  // Extract timestamps from current page
      console.log(`Current count: ${timestamps.length}`);
      const newTimestamps = await getArticleData(page); 

      assert(Array.isArray(newTimestamps), "Timestamps is not an array"); // Validate array structure, if not throw error message
	  newTimestamps.forEach((t, i) => {
	    assert(t.title && t.iso && t.unix, `Missing field(s) at ${i}`);  // Check each article to confirm existing fields.
      });
      timestamps.push(...newTimestamps); // Append to list

      if (timestamps.length >= MAX_ARTICLES) break;  // Break early if there are enough articles
 
      let success = false; // Track success of "More" button
	  
	  // Try to load next page up to MAX_RTRIES by clicking more link. 
      for (let retry = 0; retry < MAX_RETRIES; retry++) {
        try {
          await page.waitForTimeout(1500);  // Wait for DOM before interacting
		  const moreLink = await page.$('a.morelink'); // Check for "More" button before interacting
          if (!moreLink) throw new Error("No 'More' link found"); // Throw error if "More" link is not there
          await Promise.all([
            page.click('a.morelink'),  // Pagination
            page.waitForSelector('tr.athing', { timeout: 20000 })  // Wait for rows to appear
          ]);
          success = true;
		  assert(success, `Pagination failed after ${MAX_RETRIES} attempts`); // Check to see if 'More' link is valid
          break;  // Exit retry loop upon success
        } catch {
          console.warn(`Retry ${retry + 1}/${MAX_RETRIES} failed. Retrying...`);
          await page.waitForTimeout(1000);  // Wait before retrying
        }
      }
    }
    
	// Slice MAX_ARTICLES
    const first100 = timestamps.slice(0, MAX_ARTICLES);
    assert(first100.length === 100, "Exactly 100 articles were not extracted.");  // Validate number of items, if not throw error message
	// Run sort validation and display outcome
    console.log("\nResult:");
    const valid = checkOrder(first100);

    if (valid) {
      console.log(chalk.green("Articles are sorted newest to oldest."));
    } else {
      console.log(chalk.red("Sort check failed: timestamps are out of order."));
    }

    // Print log table
    displayTable(first100, MAX_ARTICLES);
  } catch (err) {
	// Catch any error(s) and display corresponding error message(s)
    console.error(chalk.red.bold("Script threw an error:"), err.message);
  } finally {
	// Close browser instance
    if (browser) {
      await browser.close();
      console.log("Closed browser.");
    }
  }
}

// Prevents sortHackerNewsArtciles() from running when file is imported into a test file.
if (process.argv[1].endsWith('index.js')) {
  sortHackerNewsArticles();
}

// Exports two functions for use in other testing files.
export { getArticleData, checkOrder, sortHackerNewsArticles };

