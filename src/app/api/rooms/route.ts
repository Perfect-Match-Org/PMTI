import { z } from "zod";
import { handle } from "@/server/http";
import { createRoom, RoomError } from "@/server/rooms";

const body = z.object({ mode: z.enum(["couple", "friends"]) });

export function POST(request: Request) {
  return handle(async (user) => {
    const parsed = body.safeParse(await request.json().catch(() => null));
    if (!parsed.success) throw new RoomError(400, "Pick couple or friends mode.");
    return { code: await createRoom(user.id, parsed.data.mode) };
  });
}
