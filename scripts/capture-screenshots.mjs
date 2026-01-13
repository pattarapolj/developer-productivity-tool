import { chromium } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function captureScreenshots() {
    console.log("🚀 Starting screenshot capture...");

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
    });
    const page = await context.newPage();

    const screenshotDir = path.join(__dirname, "..", "docs", "images");

    try {
        // Navigate to board and seed data via UI
        console.log("📋 Setting up board with sample data...");
        await page.goto("http://localhost:3000/board");
        await page.waitForLoadState("networkidle");

        // Clear existing data
        await page.evaluate(() => {
            localStorage.removeItem("ToolingTracker-storage");
        });
        await page.reload();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        // Create projects via UI
        console.log("🏗️ Creating projects...");
        await page.goto("http://localhost:3000/projects");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);

        // Create Frontend project
        await page.getByRole("button", { name: /new project/i }).click();
        await page.waitForTimeout(300);
        await page
            .getByPlaceholder(/enter project name/i)
            .fill("Frontend Development");
        await page.getByRole("button", { name: /^create project$/i }).click();
        await page.waitForTimeout(1000);

        // Create Backend project
        await page.getByRole("button", { name: /new project/i }).click();
        await page.waitForTimeout(300);
        await page.getByPlaceholder(/enter project name/i).fill("Backend API");
        await page.getByRole("button", { name: /^create project$/i }).click();
        await page.waitForTimeout(1000);

        // Create Mobile project
        await page.getByRole("button", { name: /new project/i }).click();
        await page.waitForTimeout(300);
        await page.getByPlaceholder(/enter project name/i).fill("Mobile App");
        await page.getByRole("button", { name: /^create project$/i }).click();
        await page.waitForTimeout(1000);

        // Screenshot 4: Projects View
        console.log("📸 Capturing projects view...");
        await page.screenshot({
            path: path.join(screenshotDir, "projects-view.png"),
            fullPage: false,
        });
        console.log("✅ projects-view.png saved");

        // Go to board and create tasks
        console.log("📋 Creating tasks on board...");
        await page.goto("http://localhost:3000/board");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        // Create task in Backlog
        const backlogColumn = page.locator(
            'div.rounded-lg:has(h3:text-is("Backlog"))'
        );
        let addButton = backlogColumn.locator("button.h-6.w-6").first();
        await addButton.click();
        await page.waitForTimeout(500);
        await page
            .getByPlaceholder("Task title")
            .fill("Implement User Authentication");
        await page
            .getByPlaceholder(/description/i)
            .fill("Create login/signup pages with OAuth integration");
        await page.getByRole("button", { name: /create task/i }).click();
        await page.waitForTimeout(1000);

        // Create task in To Do
        const todoColumn = page.locator(
            'div.rounded-lg:has(h3:text-is("To Do"))'
        );
        addButton = todoColumn.locator("button.h-6.w-6").first();
        await addButton.click();
        await page.waitForTimeout(300);
        await page
            .getByPlaceholder("Task title")
            .fill("Design Dashboard Components");
        await page
            .getByPlaceholder(/description/i)
            .fill("Create reusable card components for analytics");
        await page.getByRole("button", { name: /create task/i }).click();
        await page.waitForTimeout(1000);

        // Create task in In Progress
        const inProgressColumn = page.locator(
            'div.rounded-lg:has(h3:text-is("In Progress"))'
        );
        addButton = inProgressColumn.locator("button.h-6.w-6").first();
        await addButton.click();
        await page.waitForTimeout(500);
        await page.getByPlaceholder("Task title").fill("Optimize Bundle Size");
        await page
            .getByPlaceholder(/description/i)
            .fill("Reduce initial bundle with code splitting");
        await page.getByRole("button", { name: /create task/i }).click();
        await page.waitForTimeout(1000);

        // Create task in Done
        const doneColumn = page.locator(
            'div.rounded-lg:has(h3:text-is("Done"))'
        );
        addButton = doneColumn.locator("button.h-6.w-6").first();
        await addButton.click();
        await page.waitForTimeout(500);
        await page.getByPlaceholder("Task title").fill("Setup CI/CD Pipeline");
        await page
            .getByPlaceholder(/description/i)
            .fill("Configure GitHub Actions for deployment");
        await page.getByRole("button", { name: /create task/i }).click();
        await page.waitForTimeout(1000);

        // Create a few more tasks
        addButton = backlogColumn.locator("button.h-6.w-6").first();
        await addButton.click();
        await page.waitForTimeout(300);
        await page.getByPlaceholder("Task title").fill("Write E2E Tests");
        await page.getByRole("button", { name: /create task/i }).click();
        await page.waitForTimeout(1000);

        addButton = todoColumn.locator("button.h-6.w-6").first();
        await addButton.click();
        await page.waitForTimeout(300);
        await page.getByPlaceholder("Task title").fill("API Documentation");
        await page.getByRole("button", { name: /create task/i }).click();
        await page.waitForTimeout(1000);

        // Screenshot 1: Kanban Board
        console.log("📸 Capturing kanban board...");
        await page.screenshot({
            path: path.join(screenshotDir, "kanban-board.png"),
            fullPage: false,
        });
        console.log("✅ kanban-board.png saved");

        // Screenshot 3: Task Detail - click on first task
        console.log("📸 Capturing task detail...");
        const firstTask = page.locator(
            'h4:text-is("Implement User Authentication")'
        );
        await firstTask.waitFor({ state: "visible" });
        await firstTask.click();
        await page.waitForTimeout(1000);
        await page.waitForLoadState("networkidle");

        await page.screenshot({
            path: path.join(screenshotDir, "task-detail.png"),
            fullPage: false,
        });
        console.log("✅ task-detail.png saved");

        // Go back to board
        await page.goto("http://localhost:3000/board");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(500);

        // Screenshot 5: Calendar View
        console.log("📸 Capturing calendar view...");
        await page.goto("http://localhost:3000/calendar");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);

        await page.screenshot({
            path: path.join(screenshotDir, "calendar-view.png"),
            fullPage: false,
        });
        console.log("✅ calendar-view.png saved");

        // Screenshot 2: Analytics Dashboard
        console.log("📸 Capturing analytics dashboard...");
        await page.goto("http://localhost:3000/analytics");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000); // Wait for charts to render

        await page.screenshot({
            path: path.join(screenshotDir, "analytics-dashboard.png"),
            fullPage: true, // Capture full page for analytics
        });
        console.log("✅ analytics-dashboard.png saved");

        console.log("🎉 All screenshots captured successfully!");
    } catch (error) {
        console.error("❌ Error capturing screenshots:", error);
    } finally {
        await browser.close();
    }
}

captureScreenshots();
