"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/withAuth";
import { revalidatePath } from "next/cache";

export async function deleteUser(userId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    throw new Error("Ingen tilgang.");
  }

  if (userId === session.userId) {
    throw new Error("Du kan ikke slette deg selv.");
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("Bruker finnes ikke.");

  // Delete organizations where this user is the sole member
  const memberships = await db.organizationMember.findMany({
    where: { userId },
    select: { organizationId: true },
  });

  for (const m of memberships) {
    const memberCount = await db.organizationMember.count({
      where: { organizationId: m.organizationId },
    });
    if (memberCount === 1) {
      await db.organization.delete({ where: { id: m.organizationId } });
    }
  }

  await db.user.delete({ where: { id: userId } });

  revalidatePath("/admin/users");
  return { success: true };
}

export type OrgWithStats = {
  id: string;
  name: string;
  createdAt: Date;
  memberCount: number;
  transactionCount: number;
};

export type PaginatedOrgs = {
  data: OrgWithStats[];
  total: number;
  page: number;
  pageSize: number;
};

export async function getOrganizations(filters: {
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
}): Promise<PaginatedOrgs> {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    throw new Error("Ingen tilgang.");
  }

  const page = filters.page ?? 1;
  const pageSize = 20;

  const where: { name?: { contains: string; mode: "insensitive" } } = {};
  if (filters.search) {
    where.name = { contains: filters.search, mode: "insensitive" };
  }

  const sortableFields = ["name", "createdAt"] as const;
  type SF = (typeof sortableFields)[number];
  const sortBy = sortableFields.includes(filters.sortBy as SF)
    ? (filters.sortBy as SF)
    : "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const [orgs, total] = await Promise.all([
    db.organization.findMany({
      where,
      include: {
        _count: { select: { members: true, transactions: true } },
        settings: { select: { businessName: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.organization.count({ where }),
  ]);

  const data: OrgWithStats[] = orgs.map((o) => ({
    id: o.id,
    name: o.settings?.businessName ?? o.name,
    createdAt: o.createdAt,
    memberCount: o._count.members,
    transactionCount: o._count.transactions,
  }));

  return { data, total, page, pageSize };
}

export async function deleteOrganization(organizationId: string) {
  const session = await getSession();
  if (!session || session.user.role !== "super_admin") {
    throw new Error("Ingen tilgang.");
  }

  if (organizationId === session.organizationId) {
    throw new Error("Du kan ikke slette din egen organisasjon.");
  }

  const org = await db.organization.findUnique({ where: { id: organizationId } });
  if (!org) throw new Error("Organisasjon finnes ikke.");

  await db.organization.delete({ where: { id: organizationId } });

  revalidatePath("/admin/organizations");
  return { success: true };
}
