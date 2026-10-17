import { redirect } from "next/navigation";
import { Suspense } from "react";
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
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <Suspense>
        <RedirectIfSignedIn />
      </Suspense>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
