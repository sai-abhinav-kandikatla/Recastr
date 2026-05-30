import { AppShell } from "@/components/layout/AppShell";
import { SettingsPage } from "@/components/settings/settings-page";
import { getCurrentUser } from "@/lib/current-user";
import { demoProjects } from "@/lib/demo-data";

export default async function SettingsRoute() {
  const user = await getCurrentUser();

  return (
    <AppShell projects={demoProjects} title="Settings" user={user}>
      <SettingsPage currentUser={user} />
    </AppShell>
  );
}
