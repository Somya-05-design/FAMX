import assert from "node:assert";
import "dotenv/config";
import { prisma, pool } from "../lib/prisma";
import { updateProjectStatus, createProject } from "../lib/data/projects";
import { ProjectStatus, TimelineTier } from "@prisma/client";
import { Session } from "../lib/types";

async function runTests() {
  console.log("Running Project Status Transition Matrix Checks...");

  const clientUserId = "test-client-id-xyz";
  const adminUserId = "test-admin-id-xyz";

  // Clean up any stale test data
  await prisma.project.deleteMany({ where: { clientId: clientUserId } });
  await prisma.user.deleteMany({ where: { id: { in: [clientUserId, adminUserId] } } });

  // Create mock users
  await prisma.user.create({
    data: { id: clientUserId, email: "client@test.com", role: "CLIENT" },
  });
  await prisma.user.create({
    data: { id: adminUserId, email: "admin@test.com", role: "ADMIN" },
  });

  const clientSession: Session = {
    user: { id: clientUserId, email: "client@test.com", role: "CLIENT" },
  };
  const adminSession: Session = {
    user: { id: adminUserId, email: "admin@test.com", role: "ADMIN" },
  };

  // 1. Create test project (Initial status: SUBMITTED)
  const project = await createProject(clientSession, {
    title: "Test Transition Project",
    description: "Brief description",
    proposedBudget: 1000,
    timelineTier: TimelineTier.WITHIN_WEEK,
  });

  assert.strictEqual(project.status, ProjectStatus.SUBMITTED);
  console.log("✓ Initial project created with status SUBMITTED");

  // 2. Test: Client cannot transition to IN_PROGRESS directly
  await assert.rejects(
    updateProjectStatus(clientSession, project.id, ProjectStatus.IN_PROGRESS),
    /Client is not authorized/
  );
  console.log("✓ Client blocked from advancing status to IN_PROGRESS");

  // 3. Test: Admin can transition to IN_PROGRESS
  let updated = await updateProjectStatus(adminSession, project.id, ProjectStatus.IN_PROGRESS);
  assert.strictEqual(updated.status, ProjectStatus.IN_PROGRESS);
  console.log("✓ Admin advanced status to IN_PROGRESS successfully");

  // 4. Test: Client cannot cancel once IN_PROGRESS
  await assert.rejects(
    updateProjectStatus(clientSession, project.id, ProjectStatus.CANCELLED),
    /Cannot cancel project that has already started/
  );
  console.log("✓ Client blocked from cancelling IN_PROGRESS project");

  // 5. Test: Admin can complete project
  updated = await updateProjectStatus(adminSession, project.id, ProjectStatus.COMPLETED);
  assert.strictEqual(updated.status, ProjectStatus.COMPLETED);
  console.log("✓ Admin completed project successfully");

  // 6. Test: Completed project cannot be cancelled
  await assert.rejects(
    updateProjectStatus(adminSession, project.id, ProjectStatus.CANCELLED),
    /Cannot change status of a completed project/
  );
  console.log("✓ Admin blocked from cancelling a COMPLETED project");

  // 7. Test: Client cancellation on a new project
  const newProject = await createProject(clientSession, {
    title: "Second Test Project",
    description: "Another brief",
    proposedBudget: 500,
    timelineTier: TimelineTier.WITHIN_WEEK,
  });

  updated = await updateProjectStatus(clientSession, newProject.id, ProjectStatus.CANCELLED);
  assert.strictEqual(updated.status, ProjectStatus.CANCELLED);
  console.log("✓ Client cancelled SUBMITTED project successfully");

  // Clean up test data
  await prisma.project.deleteMany({ where: { clientId: clientUserId } });
  await prisma.user.deleteMany({ where: { id: { in: [clientUserId, adminUserId] } } });

  console.log("All Status Transition checks passed successfully!");
}

runTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
