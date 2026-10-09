import { AccountView } from "@/components/auth/account-view";
import { requirePageSession } from "@/lib/auth/server";
import { isDemoMode } from "@/lib/demo/mode";

export default async function AccountPage() {
  const session = await requirePageSession();
  return <AccountView demoMode={isDemoMode()} user={{
    name: typeof session.name === "string" ? session.name : "",
    email: "email" in session && typeof session.email === "string" ? session.email : null,
    photoURL: null,
  }} />;
}
