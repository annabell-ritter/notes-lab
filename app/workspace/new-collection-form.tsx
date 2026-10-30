"use client";

import { useActionState, useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/submit-button";
import {
  createCollectionAction,
  type CreateCollectionState,
} from "./actions";
import { NAME_MAX_LENGTH } from "./input-limits";

const initialState: CreateCollectionState = {};

// Mounted only while the form is open, so closing it clears the typed name and any error.
function CollectionNameForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [state, formAction] = useActionState(
    async (prevState: CreateCollectionState, formData: FormData) => {
      const result = await createCollectionAction(prevState, formData);
      if (!result.error) onClose();
      return result;
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="collection-name">Collection name</Label>
      <Input
        id="collection-name"
        name="name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Escape") onClose();
        }}
        autoFocus
        required
        maxLength={NAME_MAX_LENGTH}
        placeholder="e.g. Work"
      />
      {state.error && (
        <p className="text-xs text-destructive">{state.error}</p>
      )}
      <div className="flex gap-2">
        <SubmitButton size="sm" pendingText="Adding…">
          Add
        </SubmitButton>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export function NewCollectionForm() {
  const [isOpen, setIsOpen] = useState(false);

  if (isOpen) return <CollectionNameForm onClose={() => setIsOpen(false)} />;

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => setIsOpen(true)}
    >
      <FolderPlus />
      New collection
    </Button>
  );
}
