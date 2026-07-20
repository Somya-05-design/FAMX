import "dotenv/config";
import { test, expect } from "@playwright/test";
import { prisma } from "../lib/prisma";
import { createAdminClient } from "../lib/supabase/admin";

const TEST_PASSWORD = "testpassword123";

async function cleanTestUsers() {
  try {
    // Clean all contact inquiries from test emails
    await prisma.contactInquiry.deleteMany({
      where: {
        email: {
          startsWith: "test",
        },
      },
    });

    // Clean Supabase Auth users
    await prisma.$executeRawUnsafe(
      "DELETE FROM auth.users WHERE email LIKE 'testclient-%' OR email LIKE 'testadmin-%' OR email = 'testclient@example.com' OR email = 'testadmin@example.com'"
    ).catch(() => {});

    // Clean public User table records (handles any that auth cascading missed)
    await prisma.$executeRawUnsafe(
      "DELETE FROM \"User\" WHERE email LIKE 'testclient-%' OR email LIKE 'testadmin-%' OR email = 'testclient@example.com' OR email = 'testadmin@example.com'"
    ).catch(() => {});
  } catch (err) {
    console.error("Cleanup failed:", err);
  }
}

test.describe("Public Marketing Landing Page", () => {
  test.beforeEach(async () => {
    await cleanTestUsers();
  });

  test.afterAll(async () => {
    await cleanTestUsers();
    await prisma.$disconnect();
  });

  test("1. Unauthenticated visit to / shows landing page sections", async ({ page }) => {
    await page.goto("/");

    // Navbar checks
    const logo = page.locator("text=FAMX").first();
    await expect(logo).toBeVisible();

    const servicesLink = page.locator('nav a[href="#services"]');
    const workLink = page.locator('nav a[href="#work"]');
    const howLink = page.locator('nav a[href="#how-it-works"]');
    
    await expect(servicesLink).toBeVisible();
    await expect(workLink).toBeVisible();
    await expect(howLink).toBeVisible();

    // Hero Section checks
    await expect(page.locator("text=Trustpilot")).toBeVisible();
    await expect(page.locator("text=Get started free").first()).toBeVisible();

    // Services Section checks
    await expect(page.locator("text=Solutions").first()).toBeVisible();
    await expect(page.locator("text=Business Website")).toBeVisible();
    await expect(page.locator("text=E-commerce Platform")).toBeVisible();

    // Portfolio Section checks
    await expect(page.locator("text=Selected Work")).toBeVisible();

    // Contact Form checks
    await expect(page.locator("text=Let's build").first()).toBeVisible();
    await expect(page.locator('button:has-text("Send Message")')).toBeVisible();
  });

  test("2. Contact form submission with valid data persists to DB", async ({ page }) => {
    await page.goto("/");

    const testEmail = `testclient-${Date.now()}@example.com`;
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const messageInput = page.locator('textarea[name="message"]');
    const submitBtn = page.locator('button:has-text("Send Message")');

    await nameInput.fill("Test User");
    await emailInput.fill(testEmail);
    await messageInput.fill("Hello! I want a custom business website.");
    await submitBtn.click();

    // Verify UI success message
    await expect(page.locator("text=Inquiry Received")).toBeVisible({ timeout: 12000 });

    // Verify DB persistence
    const dbInquiry = await prisma.contactInquiry.findFirst({
      where: { email: testEmail },
    });
    expect(dbInquiry).not.toBeNull();
    expect(dbInquiry?.name).toBe("Test User");
    expect(dbInquiry?.message).toContain("Hello! I want a custom business website.");
  });

  test("3. Contact form submission with honeypot field filled is silently ignored", async ({ page }) => {
    await page.goto("/");

    const testEmail = `testclient-${Date.now()}@example.com`;
    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const messageInput = page.locator('textarea[name="message"]');
    const honeypotInput = page.locator('input[name="website"]');
    const submitBtn = page.locator('button:has-text("Send Message")');

    await nameInput.fill("Spam Bot");
    await emailInput.fill(testEmail);
    await messageInput.fill("Buy crypto today!");
    await honeypotInput.fill("http://spambot.com", { force: true });
    await submitBtn.click();

    // UI should show success so the bot is fooled
    await expect(page.locator("text=Inquiry Received")).toBeVisible({ timeout: 12000 });

    // DB should have NO records for this submission
    const dbInquiry = await prisma.contactInquiry.findFirst({
      where: { name: "Spam Bot" },
    });
    expect(dbInquiry).toBeNull();
  });

  test("4. Authenticated Client redirects to /overview when hitting /", async ({ page }) => {
    await page.context().clearCookies();
    const testEmail = `testclient-${Date.now()}@example.com`;

    // 1. Programmatically create client user to bypass UI rate limiting
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Test Client" },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create client user via admin SDK: ${authError?.message}`);
    }

    await prisma.user.upsert({
      where: { id: authData.user.id },
      update: { name: "Test Client", email: testEmail, role: "CLIENT" },
      create: { id: authData.user.id, name: "Test Client", email: testEmail, role: "CLIENT" },
    });

    // 2. Log in via UI
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to overview
    await page.waitForURL(url => url.pathname === "/overview", { timeout: 12000 });

    // 3. Visit root '/'
    await page.goto("/");

    // Should automatically redirect to '/overview' instead of showing the landing page
    await page.waitForURL(url => url.pathname === "/overview");
    await expect(page.locator("text=Portal / Client Console")).toBeVisible();
  });

  test("5. Authenticated Admin redirects to /admin when hitting /", async ({ page }) => {
    await page.context().clearCookies();
    const testEmail = `testadmin-${Date.now()}@example.com`;

    // 1. Programmatically create admin user to bypass UI rate limiting
    const supabaseAdmin = createAdminClient();
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { name: "Test Admin" },
    });

    if (authError || !authData.user) {
      throw new Error(`Failed to create admin user via admin SDK: ${authError?.message}`);
    }

    // Set role to ADMIN in DB
    await prisma.user.upsert({
      where: { id: authData.user.id },
      update: { name: "Test Admin", email: testEmail, role: "ADMIN" },
      create: { id: authData.user.id, name: "Test Admin", email: testEmail, role: "ADMIN" },
    });

    // 2. Log in
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to admin
    await page.waitForURL(url => url.pathname === "/admin", { timeout: 12000 });

    // 3. Visit root '/'
    await page.goto("/");

    // Should automatically redirect to '/admin' instead of showing the landing page
    await page.waitForURL(url => url.pathname === "/admin");
  });
});
