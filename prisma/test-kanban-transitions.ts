import assert from "node:assert";
import "dotenv/config";
import { prisma, pool } from "../lib/prisma";
import { updateProjectStatus, createProject } from "../lib/data/projects";
import { ProjectStatus, TimelineTier } from "@prisma/client";
import { Session } from "../lib/types";

async function runTests() {
  console.log("Running Kanban Board Status Transition and Guard Checks...");

  const clientUserId = "test-kanban-client-id";
  const otherClientUserId = "test-kanban-other-client-id";
  const adminUserId = "test-kanban-admin-id";

  // Clean up any stale test data
  await prisma.notification.deleteMany({ where: { userId: { in: [clientUserId, otherClientUserId, adminUserId] } } });
  await prisma.project.deleteMany({ where: { clientId: { in: [clientUserId, otherClientUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [clientUserId, otherClientUserId, adminUserId] } } });

  // Create mock users
  await prisma.user.create({
    data: { id: clientUserId, email: "client-k@test.com", role: "CLIENT" },
  });
  await prisma.user.create({
    data: { id: otherClientUserId, email: "other-k@test.com", role: "CLIENT" },
  });
  await prisma.user.create({
    data: { id: adminUserId, email: "admin-k@test.com", role: "ADMIN" },
  });

  const clientSession: Session = {
    user: { id: clientUserId, email: "client-k@test.com", role: "CLIENT" },
  };
  const otherClientSession: Session = {
    user: { id: otherClientUserId, email: "other-k@test.com", role: "CLIENT" },
  };
  const adminSession: Session = {
    user: { id: adminUserId, email: "admin-k@test.com", role: "ADMIN" },
  };

  // 1. Create a test project (Initial status: SUBMITTED)
  const project = await createProject(clientSession, {
    title: "Kanban Test Project",
    description: "Testing transition states",
    proposedBudget: 2500,
    timelineTier: TimelineTier.WITHIN_MONTH,
  });

  assert.strictEqual(project.status, ProjectStatus.SUBMITTED);
  console.log("✓ Initial project created with status SUBMITTED");

  // 2. Client Permissions: Client cannot transition project to QUOTED or IN_PROGRESS
  await assert.rejects(
    updateProjectStatus(clientSession, project.id, ProjectStatus.QUOTED, { quoteAmount: 2500 }),
    /Client is not authorized/
  );
  console.log("✓ Client blocked from setting status to QUOTED");

  // 3. Client Permissions: Client cannot cancel someone else's project
  await assert.rejects(
    updateProjectStatus(otherClientSession, project.id, ProjectStatus.CANCELLED),
    /Unauthorized/
  );
  console.log("✓ Client blocked from cancelling other client's project");

  // 4. Admin transition: SUBMITTED -> QUOTED fails without quoteAmount
  await assert.rejects(
    updateProjectStatus(adminSession, project.id, ProjectStatus.QUOTED),
    /Quote amount is required/
  );
  console.log("✓ Admin SUBMITTED -> QUOTED fails without quoteAmount");

  // 5. Admin transition: SUBMITTED -> QUOTED fails with <= 0 quoteAmount
  await assert.rejects(
    updateProjectStatus(adminSession, project.id, ProjectStatus.QUOTED, { quoteAmount: 0 }),
    /Quote amount is required/
  );
  await assert.rejects(
    updateProjectStatus(adminSession, project.id, ProjectStatus.QUOTED, { quoteAmount: -100 }),
    /Quote amount is required/
  );
  console.log("✓ Admin SUBMITTED -> QUOTED fails with invalid quoteAmount");

  // 6. Admin transition: SUBMITTED -> QUOTED succeeds with valid quoteAmount
  let updated = await updateProjectStatus(adminSession, project.id, ProjectStatus.QUOTED, { quoteAmount: 3000 });
  assert.strictEqual(updated.status, ProjectStatus.QUOTED);
  assert.strictEqual(updated.quoteAmount?.toNumber(), 3000);
  console.log("✓ Admin SUBMITTED -> QUOTED succeeds with valid quoteAmount");

  // Save the updatedAt timestamp for concurrency testing
  const initialUpdatedAt = updated.updatedAt;

  // 7. Concurrency guard check: Reject update with stale updatedAt
  const staleTime = new Date(initialUpdatedAt.getTime() - 5000);
  await assert.rejects(
    updateProjectStatus(adminSession, project.id, ProjectStatus.IN_PROGRESS, { expectedUpdatedAt: staleTime }),
    /Concurrency conflict/
  );
  console.log("✓ Concurrency guard successfully rejects stale updatedAt");

  // 8. Admin transition: QUOTED -> IN_PROGRESS with correct concurrency token succeeds
  updated = await updateProjectStatus(adminSession, project.id, ProjectStatus.IN_PROGRESS, {
    expectedUpdatedAt: initialUpdatedAt,
  });
  assert.strictEqual(updated.status, ProjectStatus.IN_PROGRESS);
  console.log("✓ Admin QUOTED -> IN_PROGRESS succeeds with valid concurrency token");

  // 9. Transition rules: Admin cannot skip status (e.g. IN_PROGRESS -> SUBMITTED)
  await assert.rejects(
    updateProjectStatus(adminSession, project.id, ProjectStatus.SUBMITTED),
    /Unauthorized status transition/
  );
  console.log("✓ Admin blocked from backwards transition (IN_PROGRESS -> SUBMITTED)");

  // 10. Admin transition: IN_PROGRESS -> COMPLETED succeeds
  updated = await updateProjectStatus(adminSession, project.id, ProjectStatus.COMPLETED);
  assert.strictEqual(updated.status, ProjectStatus.COMPLETED);
  console.log("✓ Admin IN_PROGRESS -> COMPLETED succeeds");

  // 11. Admin transition: COMPLETED -> IN_PROGRESS (manual reopen) succeeds
  updated = await updateProjectStatus(adminSession, project.id, ProjectStatus.IN_PROGRESS);
  assert.strictEqual(updated.status, ProjectStatus.IN_PROGRESS);
  console.log("✓ Admin COMPLETED -> IN_PROGRESS (manual reopen) succeeds");

  // 12. Admin transition: IN_PROGRESS -> COMPLETED succeeds again
  updated = await updateProjectStatus(adminSession, project.id, ProjectStatus.COMPLETED);
  assert.strictEqual(updated.status, ProjectStatus.COMPLETED);
  console.log("✓ Admin advanced back to COMPLETED");

  // 13. Admin transition: COMPLETED -> CANCELLED succeeds (any status -> CANCELLED)
  updated = await updateProjectStatus(adminSession, project.id, ProjectStatus.CANCELLED);
  assert.strictEqual(updated.status, ProjectStatus.CANCELLED);
  console.log("✓ Admin COMPLETED -> CANCELLED succeeds");

  // 14. Client cancellation on new project succeeds
  const newProject = await createProject(clientSession, {
    title: "Second Kanban Test Project",
    description: "Client cancel testing",
    proposedBudget: 400,
    timelineTier: TimelineTier.WITHIN_WEEK,
  });
  updated = await updateProjectStatus(clientSession, newProject.id, ProjectStatus.CANCELLED);
  assert.strictEqual(updated.status, ProjectStatus.CANCELLED);
  console.log("✓ Client can cancel own SUBMITTED project");

  // Clean up test data
  await prisma.notification.deleteMany({ where: { userId: { in: [clientUserId, otherClientUserId, adminUserId] } } });
  await prisma.project.deleteMany({ where: { clientId: { in: [clientUserId, otherClientUserId] } } });
  await prisma.user.deleteMany({ where: { id: { in: [clientUserId, otherClientUserId, adminUserId] } } });

  console.log("All Kanban Board Transition Matrix checks passed successfully!");
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
