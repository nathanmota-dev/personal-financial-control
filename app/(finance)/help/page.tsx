import { HelpView } from "@/components/finance/help/help-view";
import { requirePageSession } from "@/lib/auth/server";
export default async function HelpPage() {
  await requirePageSession();
  return <HelpView />;
}
