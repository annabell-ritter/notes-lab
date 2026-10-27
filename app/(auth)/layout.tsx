import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/auth";

// Someone who is already signed in has no reason to see /login or /signup.
async function RedirectIfSignedIn() {
  if (await getCurrentUser()) redirect("/workspace");
  return null;
}

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="relative flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="w-full max-w-sm">{children}</div>
      {/* After the form in the HTML, so keyboard users reach the email field first. */}
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
    </div>
  );
}
