import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> Navigate to http://localhost:5173
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # -> Click 'Créer un projet' to create a project and enable the canvas so widgets can be added.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div/div/div[2]/div/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Enter a project name in the modal and click the Create button to create the project and enable the canvas.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Project')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div[3]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the New Project modal by clicking the 'Créer un projet' button so a project can be created.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div/div/div[2]/div/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Enter a project name in the modal and click the Create button to create the project and enable the canvas so widgets can be added.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Project')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div[3]/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the New Project modal by clicking the 'Créer un projet' button so a project can be created and the canvas unlocked.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div/div/div[2]/div/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Enter a project name into the modal and submit the form to create the project (this will unlock the canvas).
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('Test Project')
        
        # -> Close the welcome/tutorial modal so the canvas and component panel can be interacted with (then add widgets and verify properties).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Close the tutorial/info modal (click button index 1192) so the canvas and components panel can be used.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the properties panel and select the canvas area to see if the properties panel shows editable details (this will reveal whether selection updates the properties pane).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div/div/canvas').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the components/explorer area (left panel) and add the first widget to the canvas by interacting with the canvas add control.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[2]/div/div/div/div').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div/div/canvas').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the 'Test Project' entry to load the project canvas so widgets can be added and selected.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/div/div[8]/section/div[2]/div/div/div[2]/h3').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Create a new file in the project so widgets can be added (click 'Nouveau Fichier' button).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[2]/div/div/div[3]/div[2]/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Propriétés').first).to_be_visible(timeout=3000)
        await expect(frame.locator('text=Nom').first).to_be_visible(timeout=3000)
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    