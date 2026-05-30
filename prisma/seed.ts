import { Prisma, PrismaClient } from "@prisma/client";
import {
  demoBrandVoices,
  demoProjects,
  demoScheduledPosts,
} from "../lib/demo/data";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@recastr.app" },
    update: {
      supabaseId: "demo-user",
      plan: "pro",
      role: "owner",
      name: "Demo user",
      platforms: ["TWITTER", "LINKEDIN", "INSTAGRAM", "YOUTUBE"],
      creatorType: "Founder",
    },
    create: {
      id: "demo-user",
      supabaseId: "demo-user",
      email: "demo@recastr.app",
      name: "Demo user",
      plan: "pro",
      role: "owner",
      platforms: ["TWITTER", "LINKEDIN", "INSTAGRAM", "YOUTUBE"],
      creatorType: "Founder",
    },
  });

  const organization = await prisma.organization.upsert({
    where: { slug: "recastr-demo-studio" },
    update: {
      name: "Recastr demo studio",
      ownerId: user.id,
    },
    create: {
      name: "Recastr demo studio",
      slug: "recastr-demo-studio",
      ownerId: user.id,
    },
  });

  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: { role: "owner" },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: "owner",
    },
  });

  for (const voice of demoBrandVoices) {
    await prisma.brandVoice.upsert({
      where: { id: voice.id },
      update: {
        name: voice.name,
        toneDescriptors: voice.toneDescriptors,
        bannedWords: voice.bannedWords,
        samplePosts: voice.samplePosts,
        targetAudience: voice.targetAudience,
        contentPillars: voice.contentPillars,
      },
      create: {
        id: voice.id,
        userId: user.id,
        name: voice.name,
        toneDescriptors: voice.toneDescriptors,
        bannedWords: voice.bannedWords,
        samplePosts: voice.samplePosts,
        targetAudience: voice.targetAudience,
        contentPillars: voice.contentPillars,
      },
    });
  }

  for (const project of demoProjects) {
    await prisma.project.upsert({
      where: { id: project.id },
      update: {
        title: project.title,
        sourceType: project.sourceType.toLowerCase(),
        organizationId: organization.id,
        sourceUrl: project.sourceUrl,
        thumbnailUrl: project.thumbnailUrl,
        transcript: project.transcript,
        summary: project.summary as Prisma.InputJsonValue,
        duration: project.duration,
        wordCount: project.wordCount,
      },
      create: {
        id: project.id,
        userId: user.id,
        organizationId: organization.id,
        title: project.title,
        sourceType: project.sourceType.toLowerCase(),
        sourceUrl: project.sourceUrl,
        thumbnailUrl: project.thumbnailUrl,
        transcript: project.transcript,
        summary: project.summary as Prisma.InputJsonValue,
        duration: project.duration,
        wordCount: project.wordCount,
      },
    });

    for (const hook of project.hooks ?? []) {
      await prisma.hook.upsert({
        where: { id: hook.id },
        update: {
          text: hook.text,
          hookType: hook.hookType,
          reachScore: hook.reachScore,
        },
        create: {
          id: hook.id,
          projectId: project.id,
          text: hook.text,
          hookType: hook.hookType,
          reachScore: hook.reachScore,
        },
      });
    }

    for (const item of project.contents ?? []) {
      await prisma.content.upsert({
        where: { id: item.id },
        update: {
          hookId: item.hookId,
          platform: item.platform,
          contentType: item.contentType,
          body: item.body,
          originalBody: item.originalBody,
          tone: item.tone,
          approved: item.approved,
          order: item.order,
        },
        create: {
          id: item.id,
          projectId: project.id,
          hookId: item.hookId,
          platform: item.platform,
          contentType: item.contentType,
          body: item.body,
          originalBody: item.originalBody,
          tone: item.tone,
          approved: item.approved,
          order: item.order,
        },
      });
    }
  }

  for (const post of demoScheduledPosts) {
    const scheduledAt = new Date(post.scheduledAt ?? post.publishAt);
    await prisma.scheduledPost.upsert({
      where: { id: post.id },
      update: {
        contentId: post.contentId ?? post.outputId,
        userId: user.id,
        platform: post.platform,
        scheduledAt,
        status: post.status.toLowerCase(),
      },
      create: {
        id: post.id,
        contentId: post.contentId ?? post.outputId,
        userId: user.id,
        platform: post.platform,
        scheduledAt,
        status: post.status.toLowerCase(),
      },
    });
  }

  await prisma.auditLog.upsert({
    where: { id: "demo-audit-seed" },
    update: {
      userId: user.id,
      organizationId: organization.id,
      action: "seed_demo_workspace",
      entityType: "workspace",
      entityId: organization.id,
      metadata: { projects: demoProjects.length },
    },
    create: {
      id: "demo-audit-seed",
      userId: user.id,
      organizationId: organization.id,
      action: "seed_demo_workspace",
      entityType: "workspace",
      entityId: organization.id,
      metadata: { projects: demoProjects.length },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
