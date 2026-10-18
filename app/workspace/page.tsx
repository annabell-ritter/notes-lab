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
    <div className="px-4 py-6 md:px-8 md:py-8">
      <Suspense>
        <WorkspaceHome />
      </Suspense>
    </div>
  );
}
