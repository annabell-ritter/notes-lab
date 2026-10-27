"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AuthFormState } from "./actions";

// The shared email + password form behind /login and /signup. The password goes straight to a Server Action and on to Supabase.
export function AuthForm({
  action,
  title,
  description,
  submitText,
  pendingText,
  passwordAutoComplete,
  switchPrompt,
  switchHref,
  switchText,
  forgotPasswordHref,
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  title: string;
  description: string;
  submitText: string;
  pendingText: string;
  passwordAutoComplete: "current-password" | "new-password";
  switchPrompt: string;
  switchHref: string;
  switchText: string;
  forgotPasswordHref?: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {state.message ? (
          <p role="status" className="text-sm">
            {state.message}
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-6">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                defaultValue={state.email}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete={passwordAutoComplete}
                required
              />
              {forgotPasswordHref && (
                <Link
                  href={forgotPasswordHref}
                  className="justify-self-end text-sm underline-offset-4 hover:underline"
                >
                  Forgot your password?
                </Link>
              )}
            </div>
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? pendingText : submitText}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          {switchPrompt}{" "}
          <Link href={switchHref} className="underline underline-offset-4">
            {switchText}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
