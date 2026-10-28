import { codeOf, handle, type CodeParams } from "@/server/http";
import { loadView } from "@/server/rooms";

export async function GET(_request: Request, context: CodeParams) {
  const code = await codeOf(context);
  return handle((user) => loadView(code, user.id));
}
