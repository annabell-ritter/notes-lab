import type { Metadata } from "next";
import { signUpAction } from "../actions";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Sign up · Notes Lab",
};

export default function SignUpPage() {
  return (
    <AuthForm
      action={signUpAction}
      title="Sign up"
      description="Create an account with your email and a password."
      submitText="Create account"
      pendingText="Creating account…"
      passwordAutoComplete="new-password"
      switchPrompt="Already have an account?"
      switchHref="/login"
      switchText="Sign in"
    />
  );
}
