"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/withAuth";
import { revalidatePath } from "next/cache";

export async function getMembers() {
  const session = await getSession();
  if (!session) throw new Error("Ikke autentisert.");

  const members = await db.organizationMember.findMany({
    where: { organizationId: session.organizationId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    createdAt: m.createdAt,
    user: m.user,
  }));
}

export type OrgMember = Awaited<ReturnType<typeof getMembers>>[number];

export async function searchUsers(query: string) {
  const session = await getSession();
  if (!session) throw new Error("Ikke autentisert.");

  if (session.role !== "owner" && session.role !== "admin") {
    throw new Error("Ingen tilgang.");
  }

  if (!query || query.length < 2) return [];

  // Find users not already in this organization
  const existingMemberIds = await db.organizationMember.findMany({
    where: { organizationId: session.organizationId },
    select: { userId: true },
  });
  const memberIdSet = new Set(existingMemberIds.map((m) => m.userId));

  const users = await db.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    select: { id: true, name: true, email: true },
    take: 10,
  });

  return users.filter((u) => !memberIdSet.has(u.id));
}

export async function addMember(userId: string, role: string = "member") {
  const session = await getSession();
  if (!session) throw new Error("Ikke autentisert.");

  if (session.role !== "owner" && session.role !== "admin") {
    throw new Error("Kun eier eller admin kan legge til medlemmer.");
  }

  // Verify user exists
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Bruker finnes ikke.");

  // Check not already a member
  const existing = await db.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: session.organizationId,
        userId,
      },
    },
  });
  if (existing) throw new Error("Bruker er allerede medlem.");

  await db.organizationMember.create({
    data: {
      organizationId: session.organizationId,
      userId,
      role,
    },
  });

  revalidatePath("/settings/members");
  return { success: true };
}

export async function removeMember(memberId: string) {
  const session = await getSession();
  if (!session) throw new Error("Ikke autentisert.");

  if (session.role !== "owner" && session.role !== "admin") {
    throw new Error("Kun eier eller admin kan fjerne medlemmer.");
  }

  const member = await db.organizationMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.organizationId !== session.organizationId) {
    throw new Error("Medlem ikke funnet.");
  }

  // Cannot remove yourself
  if (member.userId === session.userId) {
    throw new Error("Du kan ikke fjerne deg selv.");
  }

  // Cannot remove the owner
  if (member.role === "owner") {
    throw new Error("Kan ikke fjerne eieren av organisasjonen.");
  }

  await db.organizationMember.delete({ where: { id: memberId } });

  revalidatePath("/settings/members");
  return { success: true };
}

export async function updateMemberRole(memberId: string, role: string) {
  const session = await getSession();
  if (!session) throw new Error("Ikke autentisert.");

  if (session.role !== "owner") {
    throw new Error("Kun eier kan endre roller.");
  }

  const member = await db.organizationMember.findUnique({
    where: { id: memberId },
  });

  if (!member || member.organizationId !== session.organizationId) {
    throw new Error("Medlem ikke funnet.");
  }

  if (member.userId === session.userId) {
    throw new Error("Du kan ikke endre din egen rolle.");
  }

  if (role !== "admin" && role !== "member") {
    throw new Error("Ugyldig rolle.");
  }

  await db.organizationMember.update({
    where: { id: memberId },
    data: { role },
  });

  revalidatePath("/settings/members");
  return { success: true };
}
