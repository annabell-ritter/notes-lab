"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut, signUp } from "@/lib/auth";

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

  // The confirmation email links back to this app, which signs the user in and opens the workspace.
  const origin = (await headers()).get("origin");
  const confirmUrl = origin ? `${origin}/auth/confirm?next=/workspace` : undefined;

  let signedIn: boolean;
  try {
    ({ signedIn } = await signUp(email, password, confirmUrl));
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

export async function signOutAction() {
  await signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
