import { NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { demoBrandVoices } from "@/lib/demo-data";

export const runtime = "nodejs";

export async function GET(request: Request) {
  await getRequestUser(request);
  return NextResponse.json(demoBrandVoices);
}

export async function POST(request: Request) {
  await getRequestUser(request);
  const body = await request.json();
  return NextResponse.json(
    {
      id: `brand-${Date.now()}`,
      fingerprint: {
        toneDescriptors: ["clear", "specific", "practical"],
        sentenceRhythm: "short-to-medium with strong opening claims",
      },
      ...body,
    },
    { status: 201 },
  );
}
