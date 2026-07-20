import "dotenv/config";
import { test, expect } from "@playwright/test";
import { prisma } from "../lib/prisma";
import { createAdminClient } from "../lib/supabase/admin";

const TEST_ADMIN_EMAIL = "testadmin-restyle@example.com";
const TEST_PASSWORD = "testpassword123";

async function cleanTestUsers() {
  try {
    // Clean Supabase Auth user
    await prisma.$executeRawUnsafe(
      "DELETE FROM auth.users WHERE email = $1",
      TEST_ADMIN_EMAIL
    ).catch(() => {});

    // Clean public User table record
    await prisma.$executeRawUnsafe(
      "DELETE FROM \"User\" WHERE email = $1",
      TEST_ADMIN_EMAIL
    ).catch(() => {});
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
}

test.describe("Admin Kanban Board Restyle", () => {
  test.beforeEach(async () => {
    await cleanTestUsers();
  });

  test.afterAll(async () => {
    await cleanTestUsers();
    await prisma.$disconnect();
  });

  test("1. Admin dashboard matches visual layout spec", async ({ page }) => {
    // 1. Programmatically create admin user
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: TEST_ADMIN_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Test Restyle Admin" },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create admin user via admin SDK: ${authError?.message}`);
    }

    // Set role to ADMIN in DB
    await prisma.user.upsert({
      where: { id: authData.user.id },
      update: { name: "Test Restyle Admin", email: TEST_ADMIN_EMAIL, role: "ADMIN" },
      create: { id: authData.user.id, name: "Test Restyle Admin", email: TEST_ADMIN_EMAIL, role: "ADMIN" },
    });

    // 2. Log in
    await page.goto("/login");
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to admin
    await page.waitForURL(url => url.pathname === "/admin");

    // 3. Verify Light Theme styling is applied to layout wrapper
    const mainWrapper = page.locator("div.flex.min-h-screen");
    await expect(mainWrapper).toHaveClass(/bg-\[\#F5F6F8\]/);
    await expect(mainWrapper).toHaveClass(/text-zinc-900/);

    // 4. Verify Sidebar Elements
    const sidebar = page.locator("aside");
    await expect(sidebar).toHaveClass(/bg-white/);
    await expect(sidebar.locator("text=FAMX")).toBeVisible();
    await expect(sidebar.getByText("PROJECTS", { exact: true })).toBeVisible();
    await expect(sidebar.getByText("category", { exact: true })).toBeVisible();
    await expect(sidebar.locator('button:has-text("All Projects")')).toBeVisible();

    // Placeholders check
    await expect(sidebar.locator("text=Reports")).toBeVisible();
    await expect(sidebar.locator("text=Notifications")).toBeVisible();
    await expect(sidebar.locator("text=Invoice")).toBeVisible();
    await expect(sidebar.locator("text=Archive")).toBeVisible();

    // Pinned footer check
    await expect(sidebar.locator("text=Test Restyle Admin")).toBeVisible();

    // 5. Verify Top Bar Elements
    await expect(page.locator("h1:has-text('Dashboard')")).toBeVisible();
    await expect(page.locator('button:has-text("Add assignee")')).toBeVisible();


    // Search input check
    await expect(page.locator('input[placeholder="Search anything..."]')).toBeVisible();

    // Secondary buttons check
    await expect(page.locator('button:has-text("Filter")')).toBeVisible();
    await expect(page.locator('button:has-text("Share")')).toBeVisible();
    await expect(page.locator('button:has-text("Cancelled Project")')).toBeVisible();

    // 6. Verify Column Header Renaming: "Submitted" -> "Requested"
    await expect(page.locator("h3:has-text('Requested')")).toBeVisible();
    await expect(page.locator("h3:has-text('Quoted')")).toBeVisible();
    await expect(page.locator("h3:has-text('In Progress')")).toBeVisible();
    await expect(page.locator("h3:has-text('Completed')")).toBeVisible();

    // Verify column header plus buttons are present
    const firstColumnPlus = page.locator('button[title="Manual addition disabled"]').first();
    await expect(firstColumnPlus).toBeDisabled();

    // 7. Verify Category sidebar clicking filters URL search parameters
    const webDesignBtn = sidebar.locator("button:has-text('Web Design')");
    if (await webDesignBtn.count() > 0) {
      await webDesignBtn.click();
      await page.waitForURL(url => url.searchParams.get("category") === "Web Design");
      
      const allProjectsBtn = sidebar.locator("button:has-text('All Projects')");
      await allProjectsBtn.click();
      await page.waitForURL(url => !url.searchParams.has("category") || url.searchParams.get("category") === "ALL");
    }

    // 8. Verify Notifications sub-view transition
    const notifSidebarBtn = sidebar.locator('a:has-text("Notifications")');
    await expect(notifSidebarBtn).toBeVisible();
    await notifSidebarBtn.click();
    await page.waitForURL(url => url.searchParams.get("view") === "notifications");
    await expect(page.locator("h1:has-text('Notifications')")).toBeVisible();
    await expect(page.locator("h2:has-text('System Activity Alerts')")).toBeVisible();

    // Verify returning back to Board
    const boardSidebarBtn = sidebar.locator('a:has-text("Board")');
    await expect(boardSidebarBtn).toBeVisible();
    await boardSidebarBtn.click();
    await page.waitForURL(url => !url.searchParams.has("view") || url.searchParams.get("view") === "board");
    await expect(page.locator("h1:has-text('Dashboard')")).toBeVisible();
  });
});
