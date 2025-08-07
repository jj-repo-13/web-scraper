Date: July 22, 2025

### Web Scraper

** Description: **
This project scrapes the new tab in the Hacker News feed and performs a validation check to make sure that the articles are sorted from newest to oldest (descending) based on their timestamps. It also prints a visually formatted table on the console with deltas and includes Playwright tests to assert accuracy. 

To complete this project, Node.js, Playwright, Chalk, ES Modules, and the Web Console were utilized. For the development environment, Notepad++ and Windows PowerShell were utilized. 

### Steps to Run Script (Please make sure the PowerShell window is maximized for better visuals)

1. Unzip the downloaded File, (Run PowerShell in administrator mode and run 'powershell -ExecutionPolicy Bypass -NoProfile' as needed). Navigate to the folder using PowerShell command 'cd' followed by directory name.


2. Install dependencies using PowerShell
npm install  # Installs chalk and @playwright/test
npx playwright install  # Downloads browsers that are used by PlayWright

3. Run the script to scrape and validate
node index.js

4. Run Playwright Tests
npx playwright test

5. (Optional) Open HTML test report
npx playwright show-report

### File Contents ###
- index.js
- package.json
- playwright.config.js
- tests/ articleSort.test.js
- tests/ validation.test.js
- .gitignore
- README.txt

### Changes Made to Initial Files:
1. Converted project to ES module format, "type": "module" in package.json
2. Rewrote index.js to:
     * Use async/ await
     * Added retry logic for pagination 
     * Display a formatted table with color coded deltas for better visualization
3. Created getArticleData, checkOrder, and displayTable functions
4. Added assertions as needed
5. Added Playwright tests in the tests folder.
6. Updated .gitignore
