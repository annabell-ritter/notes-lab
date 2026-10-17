import { Suspense } from "react";
import { requireUser } from "@/lib/auth";

async function WorkspaceHome() {
  await requireUser();

  return (
    <p className="text-sm text-muted-foreground">
      Select a note from the list, or create a new one.
    </p>
  );
}

export default function WorkspacePage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <Suspense>
        <WorkspaceHome />
      </Suspense>
    </div>
  );
}
