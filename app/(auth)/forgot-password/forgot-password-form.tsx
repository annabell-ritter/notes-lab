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
import { requestPasswordResetAction } from "../actions";

// Asks for the email only. The answer is the same whether or not an account exists for it.
export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Reset your password</CardTitle>
        <CardDescription>
          Enter your email and we&apos;ll send you a link to set a new password.
        </CardDescription>
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
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Sending…" : "Send reset link"}
            </Button>
          </form>
        )}
        <p className="mt-4 text-center text-sm">
          Remembered it?{" "}
          <Link href="/login" className="underline underline-offset-4">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
