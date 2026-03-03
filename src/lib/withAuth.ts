import { headers } from "next/headers";
import { auth } from "./auth";

type AuthResult = {
  userId: string;
  user: { id: string; name: string; email: string };
};

export async function getSession(): Promise<AuthResult | null> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return null;
  }

  return {
    userId: session.user.id,
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
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
