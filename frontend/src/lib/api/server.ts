import { cookies } from "next/headers";
import "server-only";
import { serverApiBaseUrl } from "../config";

type ServerFetchOptions = RequestInit & {
  allowUnauthorized?: boolean;
};

export async function serverApifetch<T>(
  path: string,
  options?: ServerFetchOptions,
): Promise<T> {
  const cookieStore = await cookies();

  const cookieHeader = cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");

  const response = await fetch(`${serverApiBaseUrl}${path}`, {
    ...options,
    cache: "no-store",
    headers: {
      ...(cookieHeader ? { cookie: cookieHeader } : {}),
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

  if (!response.ok) {
    if (response.status === 401 && !options?.allowUnauthorized) {
      throw new Error("UNAUTHORIZED");
    }

    let message = `Request failed with status ${response.status}`;

    try {
      const payload = (await response.json()) as { message?: string };
      message = payload.message ?? message;
    } catch {}

    throw new Error(message);
  }

  return (await response.json()) as T;
}
