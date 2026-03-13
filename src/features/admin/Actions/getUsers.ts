import { db } from "@/lib/db";
import type { Prisma } from "@/generated/db/client";

export type UserWithOrg = {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
  organizationName: string | null;
};

export type PaginatedUsers = {
  data: UserWithOrg[];
  total: number;
  page: number;
  pageSize: number;
};

type UserFilters = {
  search?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export async function getUsers(filters: UserFilters): Promise<PaginatedUsers> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 20;
  const where: Prisma.userWhereInput = {};

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  if (filters.role && filters.role !== "ALL") {
    where.role = filters.role;
  }

  const sortableFields = ["name", "email", "role", "createdAt"] as const;
  type SortableField = (typeof sortableFields)[number];
  const sortBy = sortableFields.includes(filters.sortBy as SortableField)
    ? (filters.sortBy as SortableField)
    : "createdAt";
  const sortOrder = filters.sortOrder === "asc" ? "asc" : "desc";

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        memberships: {
          select: {
            organization: {
              select: {
                name: true,
                settings: { select: { businessName: true } },
              },
            },
          },
          take: 1,
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.user.count({ where }),
  ]);

  const data: UserWithOrg[] = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    createdAt: u.createdAt,
    organizationName: u.memberships[0]?.organization.settings?.businessName ?? u.memberships[0]?.organization.name ?? null,
  }));

  return { data, total, page, pageSize };
}
