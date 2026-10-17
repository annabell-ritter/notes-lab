import Link from "next/link";

export default function NoteNotFound() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center">
      <p className="text-sm font-medium">This note doesn&rsquo;t exist.</p>
      <p className="text-sm text-muted-foreground">
        It may have been deleted.{" "}
        <Link href="/workspace" className="underline underline-offset-4">
          Back to all notes
        </Link>
      </p>
    </div>
  );
}
