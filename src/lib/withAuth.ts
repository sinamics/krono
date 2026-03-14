import { headers } from "next/headers";
import { auth } from "./auth";
import { db } from "./db";

type AuthResult = {
  userId: string;
  organizationId: string;
  role: string; // org role: owner, admin, member
  user: { id: string; name: string; email: string; role: string };
};

export async function getSession(): Promise<AuthResult | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  // Find the user's organization membership
  let membership = await db.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  });

  // Auto-create organization if user has none (e.g. hook failed or pre-migration user)
  if (!membership) {
    try {
      const org = await db.organization.create({
        data: { name: session.user.name || "Min bedrift" },
      });
      membership = await db.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: session.user.id,
          role: "owner",
        },
        include: { organization: true },
      });
    } catch (err) {
      console.error("[auth] Failed to auto-create organization:", err);
      return null;
    }
  }

  // Fetch user role from db (super_admin etc)
  const userRecord = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: membership.role,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: userRecord?.role ?? "user",
    },
  };
}

export function withAuth<TArgs extends unknown[], TResult>(
  fn: (auth: AuthResult, ...args: TArgs) => Promise<TResult>
) {
  return async (...args: TArgs): Promise<TResult> => {
    const session = await getSession();

    if (!session) {
      throw new Error("Du må være innlogget for å utføre denne handlingen.");
    }

    return fn(session, ...args);
  };
}
