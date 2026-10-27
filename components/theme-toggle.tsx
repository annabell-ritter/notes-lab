"use client";

import { useEffect, useState } from "react";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const THEMES = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Laptop },
] as const;

// Light, dark or follow the device. next-themes keeps the choice in localStorage (a UI preference,
// not user data) and sets the class on <html> before the page paints.
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  // The saved theme is only known in the browser. Until then, render an empty button of the same size
  // so the server and browser HTML match and the header doesn't shift.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const current =
    THEMES.find((t) => t.value === theme) ?? THEMES.find((t) => t.value === "system")!;

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="size-8" disabled aria-hidden />;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8" aria-label={`Theme: ${current.label}`}>
          <current.Icon className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup value={current.value} onValueChange={setTheme}>
          {THEMES.map(({ value, label, Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2">
              <Icon className="size-4 text-muted-foreground" />
              {label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
