import { codeOf, handle, type CodeParams } from "@/server/http";
import { submitMove } from "@/server/rooms";

export async function POST(request: Request, context: CodeParams) {
  const code = await codeOf(context);
  const body: unknown = await request.json().catch(() => null);
  return handle((user) => submitMove(code, user.id, body));
}
