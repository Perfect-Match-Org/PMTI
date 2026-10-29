import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/server/auth";

// Only back to this site, so a crafted link can't bounce someone elsewhere after sign-in. Checked on the
// parsed URL, not the string: the parser drops tabs and newlines, so "/\t/evil.com" means "//evil.com".
function backTo(next: string | null, origin: string): URL {
  try {
    const url = new URL(next ?? "/", origin);
    if (url.origin === origin) return url;
  } catch {}
  return new URL("/", origin);
}

/** Where Google sends you back: trade the one-time code for a session, then return to the page you started on. */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const back = backTo(params.get("next"), request.nextUrl.origin);
  const code = params.get("code");
  const failed = params.get("error_description") ?? params.get("error");

  if (code && !failed) {
    const { error } = await (await supabaseServer()).auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(back);
  }
  // A code, not the message: the page maps it to fixed copy, so a link can't put words in the alert.
  back.searchParams.set("signin_error", "failed");
  return NextResponse.redirect(back);
}
