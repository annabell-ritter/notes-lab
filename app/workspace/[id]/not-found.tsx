import Link from "next/link";

export default function NoteNotFound() {
  return (
    <div className="flex flex-col gap-2 px-4 py-6 md:px-8 md:py-8">
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
