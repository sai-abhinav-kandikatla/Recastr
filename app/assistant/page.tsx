import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/current-user";
import { AssistantChat } from "@/components/assistant/AssistantChat";

export default async function AssistantPage() {
  const user = await getCurrentUser();

  return (
    <AppShell projects={[]} title="AI Assistant" user={user}>
      <AssistantChat />
    </AppShell>
  );
}
