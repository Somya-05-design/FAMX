import { test, expect } from "@playwright/test";
import { prisma } from "../lib/prisma";

const TEST_CLIENT_EMAIL = "testclient@example.com";
const TEST_ADMIN_EMAIL = "testadmin@example.com";
const TEST_PASSWORD = "testpassword123";

async function cleanTestUsers() {
  const emails = [TEST_CLIENT_EMAIL, TEST_ADMIN_EMAIL];
  for (const email of emails) {
    try {
      // Clean inquiries
      await prisma.contactInquiry.deleteMany({ where: { email } });
      
      // Clean DB users
      await prisma.user.delete({ where: { email } }).catch(() => {});
      
      // Clean Supabase Auth users
      await prisma.$executeRawUnsafe(
        "DELETE FROM auth.users WHERE email = $1",
        email
      ).catch(() => {});
    } catch (err) {
      console.error(`Cleanup failed for ${email}:`, err);
    }
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

    const servicesLink = page.locator("nav >> text=Services");
    const workLink = page.locator("nav >> text=Work");
    const howLink = page.locator("nav >> text=How It Works");
    await expect(servicesLink).toBeVisible();
    await expect(workLink).toBeVisible();
    await expect(howLink).toBeVisible();

    // Hero Section checks
    await expect(page.locator("text=Product Engineering & Brand Design Group")).toBeVisible();
    await expect(page.locator("text=Start a Project").first()).toBeVisible();

    // Services Section checks
    await expect(page.locator("text=Services & Packages")).toBeVisible();
    await expect(page.locator("text=Business Website")).toBeVisible();
    await expect(page.locator("text=Custom Web Application")).toBeVisible();

    // Portfolio Section checks
    await expect(page.locator("text=Selected Work")).toBeVisible();

    // Contact Form checks
    await expect(page.locator("text=Send us a Message")).toBeVisible();
    await expect(page.locator('button:has-text("Submit Inquiry")')).toBeVisible();
  });

  test("2. Contact form submission with valid data persists to DB", async ({ page }) => {
    await page.goto("/");

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const messageInput = page.locator('textarea[name="message"]');
    const submitBtn = page.locator('button:has-text("Submit Inquiry")');

    await nameInput.fill("Test User");
    await emailInput.fill(TEST_CLIENT_EMAIL);
    await messageInput.fill("Hello! I want a custom business website.");
    await submitBtn.click();

    // Verify UI success message
    await expect(page.locator("text=Inquiry Received")).toBeVisible();
    await expect(page.locator("text=Thank you for reaching out!")).toBeVisible();

    // Verify DB persistence
    const dbInquiry = await prisma.contactInquiry.findFirst({
      where: { email: TEST_CLIENT_EMAIL },
    });
    expect(dbInquiry).not.toBeNull();
    expect(dbInquiry?.name).toBe("Test User");
    expect(dbInquiry?.message).toBe("Hello! I want a custom business website.");
  });

  test("3. Contact form submission with honeypot field filled is silently ignored", async ({ page }) => {
    await page.goto("/");

    const nameInput = page.locator('input[name="name"]');
    const emailInput = page.locator('input[name="email"]');
    const messageInput = page.locator('textarea[name="message"]');
    // Honeypot field (hidden from view)
    const honeypotInput = page.locator('input[name="website"]');
    const submitBtn = page.locator('button:has-text("Submit Inquiry")');

    await nameInput.fill("Spam Bot");
    await emailInput.fill(TEST_CLIENT_EMAIL);
    await messageInput.fill("Buy crypto today!");
    // Bypass visibility and fill the honeypot
    await honeypotInput.fill("http://spambot.com", { force: true });
    await submitBtn.click();

    // UI should show success so the bot is fooled
    await expect(page.locator("text=Inquiry Received")).toBeVisible();

    // DB should have NO records for this submission
    const dbInquiry = await prisma.contactInquiry.findFirst({
      where: { name: "Spam Bot" },
    });
    expect(dbInquiry).toBeNull();
  });

  test("4. Authenticated Client redirects to /overview when hitting /", async ({ page }) => {
    // 1. Register test user
    await page.goto("/signup");
    await page.fill('input[name="name"]', "Test Client");
    await page.fill('input[name="email"]', TEST_CLIENT_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Wait to land on login page
    await page.waitForURL(url => url.pathname === "/login");

    // 2. Log in
    await page.fill('input[name="email"]', TEST_CLIENT_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to overview
    await page.waitForURL(url => url.pathname === "/overview");

    // 3. Visit root '/'
    await page.goto("/");

    // Should automatically redirect to '/overview' instead of showing the landing page
    await page.waitForURL(url => url.pathname === "/overview");
    await expect(page.locator("text=Portal / Client Console")).toBeVisible();
  });

  test("5. Authenticated Admin redirects to /admin when hitting /", async ({ page }) => {
    // 1. Register test user
    await page.goto("/signup");
    await page.fill('input[name="name"]', "Test Admin");
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await page.waitForURL(url => url.pathname === "/login");

    // 2. Promote user to ADMIN in database
    await prisma.user.update({
      where: { email: TEST_ADMIN_EMAIL },
      data: { role: "ADMIN" },
    });

    // 3. Log in
    await page.fill('input[name="email"]', TEST_ADMIN_EMAIL);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should redirect to admin
    await page.waitForURL(url => url.pathname === "/admin");

    // 4. Visit root '/'
    await page.goto("/");

    // Should automatically redirect to '/admin' instead of showing the landing page
    await page.waitForURL(url => url.pathname === "/admin");
  });
});
