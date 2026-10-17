import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { confirmEmail } from "@/lib/auth";

// Only follow `next` if it stays inside this app, so the link can't be used to send people elsewhere.
// Parsing it as a URL catches every form a browser would read as another site, such as
// "//evil.com", "/\evil.com" or "https://evil.com".
function safeNextPath(nextParam: string | null, requestUrl: string): string {
  const app = new URL(requestUrl);
  const target = new URL(nextParam ?? "/workspace", app);
  if (target.origin !== app.origin) return "/workspace";
  return `${target.pathname}${target.search}${target.hash}`;
}

// Opened from the sign-up confirmation email. Signs the user in, then continues to `next`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = safeNextPath(searchParams.get("next"), request.url);

  let errorMessage: string | null = null;
  try {
    await confirmEmail({
      code: searchParams.get("code"),
      tokenHash: searchParams.get("token_hash"),
      type: searchParams.get("type") as EmailOtpType | null,
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Could not confirm the email.";
  }

  if (errorMessage) redirect(`/auth/error?error=${encodeURIComponent(errorMessage)}`);
  redirect(next);
}
