import { redirect } from "next/navigation";

// The app lives under /workspace. The home page sends visitors straight there; signed-out visitors then land on /login.
export default function Home() {
  redirect("/workspace");
}
