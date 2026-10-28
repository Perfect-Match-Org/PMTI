import { codeOf, handle, type CodeParams } from "@/server/http";
import { endRoom } from "@/server/rooms";

export async function POST(_request: Request, context: CodeParams) {
  const code = await codeOf(context);
  return handle((user) => endRoom(code, user.id));
}
