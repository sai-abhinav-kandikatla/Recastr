import { AppShell } from "@/components/layout/AppShell";
import { getCurrentUser } from "@/lib/current-user";
import { MediaLibrary } from "@/components/media/MediaLibrary";

export default async function MediaPage() {
  const user = await getCurrentUser();

  return (
    <AppShell projects={[]} title="Media" user={user}>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Media Library</h1>
          <p className="mt-1 text-sm text-[#8A8A8A]">
            Manage images, videos, and audio used across your content.
          </p>
        </div>

        <MediaLibrary />
      </div>
    </AppShell>
  );
}
