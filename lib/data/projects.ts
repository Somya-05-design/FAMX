import { prisma } from "../prisma";
import { Session } from "../types";
import { ProjectStatus, TimelineTier, Prisma } from "@prisma/client";

// Core project queries with strict session-based authorization checks

export async function getProjectsForUser(session: Session) {
  const projects = await prisma.project.findMany({
    where: session.user.role === "ADMIN" ? {} : { clientId: session.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      client: {
        select: { name: true, email: true }
      },
      service: true
    }
  });

  return projects.map((project) => ({
    ...project,
    proposedBudget: project.proposedBudget.toNumber(),
    quoteAmount: project.quoteAmount ? project.quoteAmount.toNumber() : null,
  }));
}

export async function getProjectById(session: Session, projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      client: {
        select: { id: true, name: true, email: true }
      },
      service: true,
      attachments: true,
      payments: {
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!project) {
    return null;
  }

  // Authorization check
  if (session.user.role === "CLIENT" && project.clientId !== session.user.id) {
    throw new Error("Unauthorized access to project");
  }

  return project;
}

export interface CreateProjectInput {
  serviceId?: string;
  customServiceText?: string;
  title: string;
  description: string;
  requirements?: string;
  proposedBudget: number | Prisma.Decimal;
  timelineTier: TimelineTier;
  customExpectedDate?: Date;
  attachmentIds?: string[];
}

export async function createProject(session: Session, input: CreateProjectInput) {
  if (session.user.role !== "CLIENT") {
    throw new Error("Only clients can create projects");
  }

  const project = await prisma.project.create({
    data: {
      clientId: session.user.id,
      serviceId: input.serviceId,
      customServiceText: input.customServiceText,
      title: input.title,
      description: input.description,
      requirements: input.requirements,
      proposedBudget: new Prisma.Decimal(input.proposedBudget),
      timelineTier: input.timelineTier,
      customExpectedDate: input.customExpectedDate,
      status: ProjectStatus.SUBMITTED,
    }
  });

  // Link attachments to project if provided
  if (input.attachmentIds && input.attachmentIds.length > 0) {
    await prisma.attachment.updateMany({
      where: {
        id: { in: input.attachmentIds },
        uploaderId: session.user.id
      },
      data: {
        projectId: project.id
      }
    });
  }

  return project;
}

export async function updateProjectStatus(
  session: Session,
  projectId: string,
  newStatus: ProjectStatus,
  opts?: { quoteAmount?: number; expectedUpdatedAt?: Date | string }
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new Error("Project not found");
  }

  const currentStatus = project.status;

  if (session.user.role === "CLIENT") {
    // Client can only transition to CANCELLED from SUBMITTED or QUOTED
    if (newStatus !== ProjectStatus.CANCELLED) {
      throw new Error("Client is not authorized to change status to " + newStatus);
    }
    if (currentStatus !== ProjectStatus.SUBMITTED && currentStatus !== ProjectStatus.QUOTED) {
      throw new Error("Cannot cancel project that has already started");
    }
    if (project.clientId !== session.user.id) {
      throw new Error("Unauthorized");
    }
  } else if (session.user.role === "ADMIN") {
    // Concurrency guard
    if (opts?.expectedUpdatedAt) {
      const dbTime = new Date(project.updatedAt).getTime();
      const clientTime = new Date(opts.expectedUpdatedAt).getTime();
      if (dbTime !== clientTime) {
        throw new Error("Concurrency conflict: this project was updated elsewhere, refresh and try again.");
      }
    }

    // Transition matrix checks
    const ALLOWED_ADMIN_TRANSITIONS: Record<ProjectStatus, ProjectStatus[]> = {
      [ProjectStatus.SUBMITTED]: [ProjectStatus.QUOTED, ProjectStatus.CANCELLED],
      [ProjectStatus.QUOTED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
      [ProjectStatus.IN_PROGRESS]: [ProjectStatus.COMPLETED, ProjectStatus.CANCELLED],
      [ProjectStatus.COMPLETED]: [ProjectStatus.IN_PROGRESS, ProjectStatus.CANCELLED],
      [ProjectStatus.CANCELLED]: [ProjectStatus.CANCELLED],
    };

    const allowed = ALLOWED_ADMIN_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(`Unauthorized status transition from ${currentStatus} to ${newStatus}`);
    }

    // Quote completeness
    if (newStatus === ProjectStatus.QUOTED) {
      const amount = opts?.quoteAmount !== undefined ? opts.quoteAmount : project.quoteAmount?.toNumber();
      if (amount === undefined || amount === null || amount <= 0) {
        throw new Error("Quote amount is required and must be greater than zero when quoting a project");
      }
    }
  } else {
    throw new Error("Unauthorized");
  }

  const updateData: Prisma.ProjectUpdateInput = {
    status: newStatus,
    updatedAt: new Date(),
  };

  if (newStatus === ProjectStatus.QUOTED && opts?.quoteAmount !== undefined) {
    updateData.quoteAmount = new Prisma.Decimal(opts.quoteAmount);
  }

  const updatedProject = await prisma.project.update({
    where: { id: projectId },
    data: updateData
  });

  // Trigger relevant notifications on success
  try {
    const { createNotification } = await import("./notifications");
    const notificationType = newStatus === ProjectStatus.QUOTED ? "QUOTE_RECEIVED" : "PROJECT_STATUS_CHANGED";
    await createNotification(
      updatedProject.clientId,
      notificationType,
      updatedProject.id
    );
  } catch (err) {
    console.error("Failed to trigger project status notification", err);
  }

  return updatedProject;
}

export async function updateQuoteAmount(
  session: Session,
  projectId: string,
  quoteAmount: number | Prisma.Decimal
) {
  if (session.user.role !== "ADMIN") {
    throw new Error("Only admins can set or update quote amount");
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new Error("Project not found");
  }

  // Update quote amount. If status was SUBMITTED, advance it to QUOTED automatically.
  const nextStatus = project.status === ProjectStatus.SUBMITTED ? ProjectStatus.QUOTED : project.status;

  return await prisma.project.update({
    where: { id: projectId },
    data: {
      quoteAmount: new Prisma.Decimal(quoteAmount),
      status: nextStatus
    }
  });
}

export async function toggleDispute(session: Session, projectId: string, isDisputed: boolean) {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new Error("Project not found");
  }

  if (project.status !== ProjectStatus.COMPLETED) {
    throw new Error("Only completed projects can be disputed");
  }

  if (session.user.role === "CLIENT" && project.clientId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  return await prisma.project.update({
    where: { id: projectId },
    data: { isDisputed }
  });
}
