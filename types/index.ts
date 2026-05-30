export type {
  BrandVoice,
  ContentPiece as ContentCard,
  GenerationRequest,
  ViralHook as Hook,
  IngestionStep,
  Platform,
  Plan,
  PostStatus,
  Project,
  ScheduledPost,
  SocialOutput,
  SourceSummary,
  SourceType,
  Tone,
} from "@/lib/types";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  creatorType: string | null;
  tonePref: string;
  platforms: Array<"twitter" | "linkedin" | "instagram" | "youtube">;
  plan: "free" | "pro" | "team";
  planExpiresAt: string | null;
}
