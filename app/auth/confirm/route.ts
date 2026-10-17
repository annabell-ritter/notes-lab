import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { confirmEmail } from "@/lib/auth";

// Opened from the sign-up confirmation email. Signs the user in, then continues to `next`.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const nextParam = searchParams.get("next") ?? "/workspace";
  // Only follow paths inside this app, so the link can't be used to send people elsewhere.
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/workspace";

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
