import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import * as jose from "jose";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  if (!process.env.SUPABASE_JWT_SECRET) {
    console.error("SUPABASE_JWT_SECRET is not defined");
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }

  const secret = new TextEncoder().encode(process.env.SUPABASE_JWT_SECRET);

  const token = await new jose.SignJWT({
    sub: session.user.email,
    role: "authenticated",
    aud: "authenticated",
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(secret);

  return Response.json({ token });
}
