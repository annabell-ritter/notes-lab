import { cache } from "react";
import { redirect } from "next/navigation";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

// All Supabase Auth calls live here, the same way lib/db.ts holds all data access.
// Supabase handles passwords and sessions; this file never sees or stores a password beyond passing it on.

export type CurrentUser = {
  id: string;
  email: string | null;
};

// Verifies the session token on the server (getClaims checks its signature) instead of trusting the cookie as-is.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;

  return { id: data.claims.sub, email: data.claims.email ?? null };
});

// For protected pages and Server Actions: returns the signed-in user or sends the visitor to /login.
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

// How long after opening a reset link the user may set a new password.
const RECOVERY_WINDOW_SECONDS = 15 * 60;

// Only a session that was just created from a password reset link may change the password.
// A normal session, such as a stolen cookie, can't.
export async function hasRecentRecovery(): Promise<boolean> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return false;

  const oldestAllowed = Math.floor(Date.now() / 1000) - RECOVERY_WINDOW_SECONDS;
  return (data.claims.amr ?? []).some(
    (entry) =>
      typeof entry !== "string" && entry.method === "recovery" && entry.timestamp >= oldestAllowed,
  );
}

// For the set-new-password page: sends signed-out visitors to /login and
// signed-in users without a recent reset link to /workspace.
export async function requireRecoverySession(): Promise<CurrentUser> {
  const user = await requireUser();
  if (!(await hasRecentRecovery())) redirect("/workspace");
  return user;
}

export async function signUp(
  email: string,
  password: string,
  emailRedirectTo?: string,
): Promise<{ signedIn: boolean }> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { emailRedirectTo },
  });
  if (error) throw error;

  // Without a session, the project requires the user to confirm their email first.
  return { signedIn: data.session !== null };
}

export async function signIn(email: string, password: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Supabase sends the email only if an account exists, and answers the same either way,
// so the caller can't tell which emails have accounts.
export async function requestPasswordReset(email: string, redirectTo: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (!error) return;

  console.error("Password reset email failed:", error);
  if (error.status === 429) {
    throw new Error("Too many reset emails were requested. Wait a while and try again.");
  }
  throw new Error("Could not send the reset email. Try again later.");
}

// Sets the new password, then signs out the user's other sessions, in case the reset
// happened because someone else had access to the account.
export async function updatePassword(password: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw error;

  // The password is already changed at this point, so a failure here must not look like the change failed:
  // a retry with the same password would then be rejected as unchanged.
  const { error: signOutError } = await supabase.auth.signOut({ scope: "others" });
  if (signOutError) console.error("Signing out other sessions failed:", signOutError);
}

// The confirmation link arrives either with a PKCE `code` (default email template)
// or with a `token_hash` (custom template), so both are accepted.
export async function confirmEmail(params: {
  code: string | null;
  tokenHash: string | null;
  type: EmailOtpType | null;
}): Promise<void> {
  const supabase = await createClient();

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    if (error) throw error;
    return;
  }

  if (params.tokenHash && params.type) {
    const { error } = await supabase.auth.verifyOtp({
      type: params.type,
      token_hash: params.tokenHash,
    });
    if (error) throw error;
    return;
  }

  throw new Error("The confirmation link is missing its code.");
}
