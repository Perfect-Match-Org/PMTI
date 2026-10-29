import { codeOf, handle, type CodeParams } from "@/server/http";
import { setShareName } from "@/server/rooms";

export async function POST(request: Request, context: CodeParams) {
  const code = await codeOf(context);
  const body = await request.json().catch(() => null);
  return handle((user) => setShareName(code, user.id, body));
}
