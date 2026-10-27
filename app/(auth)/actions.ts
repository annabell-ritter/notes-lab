"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  requestPasswordReset,
  requireRecoverySession,
  signIn,
  signOut,
  signUp,
  updatePassword,
} from "@/lib/auth";

export type AuthFormState = {
  error?: string;
  message?: string;
  email?: string;
};

function readCredentials(formData: FormData) {
  return {
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  };
}

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

// Links in auth emails go back to this app's /auth/confirm, which signs the user in and continues to `next`.
// The address comes from SITE_URL, not the request's Origin header, which a caller can set to any site.
function confirmUrl(next: string) {
  const siteUrl = process.env.SITE_URL;
  if (!siteUrl) throw new Error("SITE_URL is not set. Add it to .env.local (see README).");
  return new URL(`/auth/confirm?next=${next}`, siteUrl).toString();
}

export async function signInAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and password.", email };

  try {
    await signIn(email, password);
  } catch (error) {
    return { error: errorMessage(error, "Could not sign in."), email };
  }

  revalidatePath("/", "layout");
  redirect("/workspace");
}

export async function signUpAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const { email, password } = readCredentials(formData);
  if (!email || !password) return { error: "Enter your email and a password.", email };

  // The confirmation email signs the user in and opens the workspace.
  const redirectTo = confirmUrl("/workspace");

  let signedIn: boolean;
  try {
    ({ signedIn } = await signUp(email, password, redirectTo));
  } catch (error) {
    return { error: errorMessage(error, "Could not create the account."), email };
  }

  if (!signedIn) {
    return {
      message: `Almost done. We sent a confirmation link to ${email}. Open it to finish signing up.`,
      email,
    };
  }

  revalidatePath("/", "layout");
  redirect("/workspace");
}

export async function requestPasswordResetAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Enter your email." };

  // The reset email signs the user in with a short-lived recovery session and opens /reset-password.
  const redirectTo = confirmUrl("/reset-password");

  try {
    await requestPasswordReset(email, redirectTo);
  } catch (error) {
    return { error: errorMessage(error, "Could not send the reset email."), email };
  }

  return {
    message: `If an account exists for ${email}, we sent a link to reset your password. Open it in this browser.`,
    email,
  };
}

export async function updatePasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  await requireRecoverySession();

  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  if (!password) return { error: "Enter a new password." };
  if (password !== confirmPassword) return { error: "The two passwords don't match." };

  try {
    await updatePassword(password);
  } catch (error) {
    return { error: errorMessage(error, "Could not change the password.") };
  }

  revalidatePath("/", "layout");
  redirect("/workspace");
}

export async function signOutAction() {
  await signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
