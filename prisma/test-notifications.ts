import assert from "node:assert";
import "dotenv/config";
import { prisma, pool } from "../lib/prisma";
import { createNotification, deleteNotification, getNotificationRecipients } from "../lib/data/notifications";
import { NotificationType, TimelineTier } from "@prisma/client";
import { Session } from "../lib/types";

async function runNotificationTests() {
  console.log("Running Notification Targeting and Deletion Unit Tests...");

  const clientUserId = "test-notif-client-id";
  const adminUserId = "test-notif-admin-id";
  const otherClientUserId = "test-notif-other-client-id";
  const projectId = "test-notif-project-id";

  // Clean up any stale test data
  await prisma.notification.deleteMany({ where: { projectId } });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.user.deleteMany({ where: { id: { in: [clientUserId, adminUserId, otherClientUserId] } } });

  // 1. Setup Test Users
  await prisma.user.create({
    data: { id: clientUserId, email: "client-notif@test.com", role: "CLIENT" },
  });
  await prisma.user.create({
    data: { id: adminUserId, email: "admin-notif@test.com", role: "ADMIN" },
  });
  await prisma.user.create({
    data: { id: otherClientUserId, email: "other-notif@test.com", role: "CLIENT" },
  });

  const clientSession: Session = {
    user: { id: clientUserId, email: "client-notif@test.com", role: "CLIENT" },
  };
  const adminSession: Session = {
    user: { id: adminUserId, email: "admin-notif@test.com", role: "ADMIN" },
  };

  // 2. Setup Test Project
  await prisma.project.create({
    data: {
      id: projectId,
      title: "Notification Test Project",
      description: "Testing notification recipient filtering",
      clientId: clientUserId,
      proposedBudget: 1000,
      timelineTier: TimelineTier.WITHIN_MONTH,
    },
  });

  // 3. Test getNotificationRecipients helper directly
  const clientRecipients = await getNotificationRecipients(projectId, clientUserId);
  assert.ok(!clientRecipients.includes(clientUserId), "Actor (Client) should be excluded from recipients");
  assert.ok(clientRecipients.includes(adminUserId), "Admin should be included in recipients when Client acts");

  const adminRecipients = await getNotificationRecipients(projectId, adminUserId);
  assert.ok(!adminRecipients.includes(adminUserId), "Actor (Admin) should be excluded from recipients");
  assert.ok(adminRecipients.includes(clientUserId), "Client should be included in recipients when Admin acts");

  // 4. Test Notification Creation for EVERY Event Type
  const eventTypes: { type: NotificationType; actorId: string }[] = [
    { type: "NEW_MESSAGE", actorId: clientUserId },
    { type: "NEW_MESSAGE", actorId: adminUserId },
    { type: "QUOTE_RECEIVED", actorId: adminUserId },
    { type: "PAYMENT_REQUESTED", actorId: adminUserId },
    { type: "PAYMENT_VERIFICATION_REQUESTED", actorId: clientUserId },
    { type: "PAYMENT_SUCCEEDED", actorId: adminUserId },
    { type: "PAYMENT_REJECTED", actorId: adminUserId },
    { type: "PROJECT_STATUS_CHANGED", actorId: adminUserId },
    { type: "NEW_PROJECT_SUBMITTED", actorId: clientUserId },
    { type: "BUDGET_COUNTER_OFFER", actorId: clientUserId },
    { type: "BUDGET_COUNTER_OFFER", actorId: adminUserId },
  ];

  for (const { type, actorId } of eventTypes) {
    console.log(`Testing event type: ${type} with actor: ${actorId}`);
    
    // Clear notifications before each event test
    await prisma.notification.deleteMany({ where: { projectId } });

    const createdNotifications = await createNotification({
      projectId,
      type,
      actorUserId: actorId,
    });

    const notifUserIds = createdNotifications.map((n) => n.userId);

    // CRITICAL ASSERTION: Actor's own userId must NEVER appear among recipient Notification rows
    assert.strictEqual(
      notifUserIds.includes(actorId),
      false,
      `Actor ${actorId} MUST NOT receive notification for event ${type}`
    );

    // Verify created rows in DB match
    const dbNotifs = await prisma.notification.findMany({ where: { projectId } });
    assert.strictEqual(dbNotifs.length, createdNotifications.length);
    assert.ok(dbNotifs.every((n) => n.userId !== actorId), `DB rows must not contain actor ${actorId}`);
  }

  // 5. Test Delete Notification
  console.log("Testing Notification Deletion and Authorization...");
  await prisma.notification.deleteMany({ where: { projectId } });

  // Create notification for client (triggered by admin)
  const [clientNotif] = await createNotification({
    projectId,
    type: "QUOTE_RECEIVED",
    actorUserId: adminUserId,
  });

  assert.strictEqual(clientNotif.userId, clientUserId);

  // Attempt unauthorized delete by admin -> should throw error
  let threwUnauthorized = false;
  try {
    await deleteNotification(adminSession, clientNotif.id);
  } catch (err: any) {
    threwUnauthorized = true;
    assert.match(err.message, /Unauthorized/);
  }
  assert.strictEqual(threwUnauthorized, true, "Admin should not be able to delete client's notification");

  // Authorized delete by client -> should succeed
  const deleted = await deleteNotification(clientSession, clientNotif.id);
  assert.strictEqual(deleted.id, clientNotif.id);

  const deletedCheck = await prisma.notification.findUnique({ where: { id: clientNotif.id } });
  assert.strictEqual(deletedCheck, null, "Notification should be deleted from DB");

  // Cleanup test data
  await prisma.notification.deleteMany({ where: { projectId } });
  await prisma.project.deleteMany({ where: { id: projectId } });
  await prisma.user.deleteMany({ where: { id: { in: [clientUserId, adminUserId, otherClientUserId] } } });

  console.log("✅ All Notification unit tests passed successfully!");
}

runNotificationTests()
  .catch((err) => {
    console.error("❌ Notification Unit Test Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
