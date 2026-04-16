const puppeteer = require('puppeteer');

/**
 * Automates logging into Video Generator and clicking the 'Submit' button on the most recent draft video.
 * Assumes the draft was already created by the API.
 */
async function triggerVideoGeneratorDraftRender(email, password, maxRetries = 3) {
    if (!email || !password) {
        throw new Error('Missing Video Generator credentials in environment variables.');
    }

    console.log('[Puppeteer] Starting Video Generator draft automation...');
    let browser;
    try {
        browser = await puppeteer.launch({
            headless: 'new', // Use new headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });
        
        // 1. Go to Login Page
        console.log('[Puppeteer] Navigating to login...');
        await page.goto('https://app.Video Generator.com/login', { waitUntil: 'networkidle2' });
        
        // 2. Fill Credentials
        console.log('[Puppeteer] Typing credentials...');
        await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 15000 });
        await page.type('input[name="email"], input[type="email"]', email);
        
        // Find and click 'Use Password?' or 'Continue with email'
        const passwordBtnClicked = await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const usePwd = btns.find(b => b.innerText && b.innerText.toLowerCase().includes('use password'));
            if (usePwd) {
                usePwd.click();
                return true;
            }
            const contEmail = btns.find(b => b.innerText && b.innerText.toLowerCase().includes('continue with email'));
            if (contEmail) {
                contEmail.click();
                return true;
            }
            return false;
        });

        if (passwordBtnClicked) {
            console.log('[Puppeteer] Clicked step 2 login button...');
            await new Promise(r => setTimeout(r, 2000));
        }

        // Find password input
        await page.waitForSelector('input[name="password"], input[type="password"]', { timeout: 15000 });
        await page.type('input[name="password"], input[type="password"]', password);
        
        // Click Verify / Login button explicitly
        await page.evaluate(() => {
            const btns = Array.from(document.querySelectorAll('button'));
            const submitBtn = btns.find(b => {
                const text = (b.innerText || '').toLowerCase();
                return (text.includes('verify') || text.includes('log in') || text.includes('sign in')) && !b.disabled;
            });
            if (submitBtn) {
                submitBtn.click();
            }
        });
        
        // Wait for navigation to dashboard
        console.log('[Puppeteer] Waiting for login to complete...');
        // Use a longer timeout and wait for the network to be mostly idle
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 });
        
        // 3. Navigate to Home/Videos where drafts live
        // Usually, logging in redirects to the dashboard which shows recent videos or drafts.
        console.log('[Puppeteer] Looking for draft video...');
        
        // Wait for the video library to load
        // This selector targets a video card that specifically has an "Edit" button or "Draft" label
        // Video Generator often uses generic classes, so we might need to look for specific text
        
        // Wait a few seconds for data to load
        await new Promise(r => setTimeout(r, 5000));
        
        // Find the top-most draft video and click its 'Edit' button
        // Since Video Generator is heavily React-based, we look for buttons containing "Edit" or similar.
        
        // NOTE: This specific logic is fragile and heavily depends on Video Generator's DOM.
        // We will try an approach that looks for links containing 'editor' or buttons containing 'Edit'
        
        const editClicked = await page.evaluate(() => {
            // Find any element that looks like an edit button for a video
            // Often, drafts have an 'Edit' button or a pencil icon
            const elements = Array.from(document.querySelectorAll('*'));
            const editBtn = elements.find(el => 
                (el.tagName === 'BUTTON' || el.tagName === 'A') && 
                el.innerText && el.innerText.toLowerCase().includes('edit') &&
                el.getBoundingClientRect().width > 0 // Ensure it's visible
            );
            
            if (editBtn) {
                editBtn.click();
                return true;
            }
            return false;
        });

        if (!editClicked) {
            throw new Error('Could not find an Edit button for a draft video on the dashboard.');
        }

        console.log('[Puppeteer] Clicked Edit video, waiting for editor to load...');
        
        // Wait for the editor to load (URL should contain /editor or /create)
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 });
        await new Promise(r => setTimeout(r, 3000)); // Additional buffer for JS to initialize

        // 4. Click Submit in the Editor
        console.log('[Puppeteer] Looking for Submit button...');
        
        const submitClicked = await page.evaluate(() => {
             const elements = Array.from(document.querySelectorAll('*'));
             const submitBtn = elements.find(el => 
                 el.tagName === 'BUTTON' && 
                 el.innerText && el.innerText.toLowerCase().includes('submit') &&
                 el.getBoundingClientRect().width > 0
             );
             
             if (submitBtn) {
                  submitBtn.click();
                  return true;
             }
             return false;
        });

        if (!submitClicked) {
            throw new Error('Could not find the Submit button in the video editor.');
        }

        console.log('[Puppeteer] Successfully clicked Submit! The video should now be rendering.');
        
        // Wait a small amount to allow the submit network request to fire before closing
        await new Promise(r => setTimeout(r, 3000));
        
        await browser.close();
        return true;

    } catch (error) {
        console.error('[Puppeteer] Automation failed:', error.message);
        try {
            if (browser && (await browser.pages()).length > 0) {
                const pages = await browser.pages();
                await pages[0].screenshot({ path: 'puppeteer_error.png' });
                console.log('[Puppeteer] Saved screenshot to puppeteer_error.png');
            }
        } catch(e) {}
        if (browser) await browser.close();
        if (maxRetries > 0) {
            console.log(`[Puppeteer] Retrying... (${maxRetries} left)`);
            return triggerVideoGeneratorDraftRender(email, password, maxRetries - 1);
        }
        throw error;
    }
}

module.exports = { triggerVideoGeneratorDraftRender };
