import "server-only";
import { currentUser, type SessionUser } from "./auth";
import { RoomError } from "./rooms";

/** Auth + error mapping shared by every API route. */
export async function handle(fn: (user: SessionUser) => Promise<unknown>): Promise<Response> {
  const user = await currentUser();
  if (!user) return Response.json({ error: "Sign in first." }, { status: 401 });
  try {
    return Response.json((await fn(user)) ?? { ok: true });
  } catch (error) {
    if (error instanceof RoomError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

export type CodeParams = { params: Promise<{ code: string }> };

export async function codeOf({ params }: CodeParams): Promise<string> {
  return (await params).code.toUpperCase();
}
