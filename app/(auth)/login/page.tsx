import type { Metadata } from "next";
import { signInAction } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sign in · Notes Lab",
};

export default function LoginPage() {
  return (
    <AuthForm
      action={signInAction}
      title="Sign in"
      description="Enter your email and password to open your notes."
      submitText="Sign in"
      pendingText="Signing in…"
      passwordAutoComplete="current-password"
      switchPrompt="Don't have an account?"
      switchHref="/signup"
      switchText="Sign up"
      forgotPasswordHref="/forgot-password"
    />
  );
}
