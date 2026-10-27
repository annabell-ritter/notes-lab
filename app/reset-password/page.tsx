import type { Metadata } from "next";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireRecoverySession } from "@/lib/auth";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Set a new password · Notes Lab",
};

// Opened from the password reset email, after /auth/confirm has signed the user in.
// Not part of app/(auth)/, because that layout sends signed-in users to /workspace.
async function ResetPassword() {
  await requireRecoverySession();
  return <ResetPasswordForm />;
}

export default function ResetPasswordPage() {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Suspense>
          <ResetPassword />
        </Suspense>
      </div>
      {/* After the form in the HTML, so keyboard users reach the password field first. */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
