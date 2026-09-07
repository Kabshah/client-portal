import { AuthMeResponse, User, UserRole } from "@/types/auth";
import { serverApifetch } from "./server";
import { redirect } from "next/navigation";

function isUnauthorizedError(error: unknown) {
  return (
    error instanceof Error &&
    error.message.toLowerCase().includes("unauthorized")
  );
}

export async function getUserInfo(): Promise<User | null> {
  try {
    const auth = await serverApifetch<AuthMeResponse>("/auth/me");
    return auth.user;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return null;
    }
    throw error;
  }
}

export async function requireUser(allowedRoles?: UserRole[]): Promise<User> {
  const user = await getUserInfo();

  if (!user) {
    redirect("/");
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    redirect(user.role === "admin" ? "/admin" : "/");
  }

  return user;
}
