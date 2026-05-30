import { AppShell } from "@/components/layout/AppShell";
import { BrandVoiceWizard } from "@/components/onboarding/brand-voice-wizard";
import { getCurrentUser } from "@/lib/current-user";
import { demoProjects } from "@/lib/demo-data";

export default async function OnboardingPage() {
  const user = await getCurrentUser();

  return (
    <AppShell projects={demoProjects} title="Brand Voice" user={user}>
      <BrandVoiceWizard />
    </AppShell>
  );
}
