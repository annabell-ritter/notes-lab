import { redirect } from "next/navigation";

// The app lives under /notes. The home page sends visitors straight there.
export default function Home() {
  redirect("/notes");
}
