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
        
        # -> Click the 'Créer un projet' button to create a new project so widgets can be added to the canvas.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div/div/div[2]/div/div/div[3]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Enter a project name into the 'Nom du projet...' input and click the Create button to create the project.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div[3]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('ExportTestProject')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div/div[3]/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the workspace controls to reveal workspace actions (to find the export action) by clicking the 'Ouvrir l'espace de travail' button.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Dismiss the bottom 'Optimisé pour les grands écrans' modal then add a widget to the canvas (click the canvas area) so workspace actions (including export) can be accessed.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div/div/canvas').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the New Project flow by clicking the 'Nouveau projet' button to create a project so widgets can be added to the workspace.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/div/div[8]/div/div[3]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Enter a project name in the modal and click 'Créer' to create the project.
        frame = context.pages[-1]
        # Input text
        elem = frame.locator('xpath=/html/body/div[3]/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('ExportTestProject')
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[3]/div[3]/button[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Add a widget to the canvas by clicking the canvas, then open the workspace controls to reveal the export action.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div/div/canvas').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Close the welcome/tour modal, open workspace/settings menu, and look for an 'Export' or 'Exporter' action in workspace controls or explorer. If no export feature is present, report the issue and finish.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[4]/div/div/div[2]/div/div/div/div/div/div[3]/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the widgets/components panel so a widget can be added to the canvas (click 'Afficher les widgets'), then add a widget to the canvas to enable workspace export actions.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the widgets/components panel, try to add a widget to the canvas, then open the workspace controls to look for an Export/Exporter action.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div/div/canvas').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Open the ExportTestProject item in the workspace to load the project workspace and reveal canvas/workspace actions (so a widget can be added and export action located).
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/div/div[8]/section/div[2]/div/div/div[2]').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Dismiss the 'Optimisé pour les grands écrans' modal, open the widgets panel and add a widget to the canvas, then open workspace controls to look for an Export/Exporter action.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[3]/div[2]/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div/div/canvas').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # -> Add a widget to the canvas by clicking the canvas, then open the workspace/parameters to look for an Export/Exporter action.
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div/div/canvas').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/div/div/div/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        frame = context.pages[-1]
        # Click element
        elem = frame.locator('xpath=/html/body/div/div/div/main/div[4]/div/div/div[2]/div/div/div/div/div/div[3]/div/div/div[2]/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        
        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Export Successful').first).to_be_visible(timeout=3000)
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    