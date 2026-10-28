import { codeOf, handle, type CodeParams } from "@/server/http";
import { kickGuest } from "@/server/rooms";

export async function POST(_request: Request, context: CodeParams) {
  const code = await codeOf(context);
  return handle((user) => kickGuest(code, user.id));
}
