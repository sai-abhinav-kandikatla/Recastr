import { ZodError } from "zod";
import { isMissingPrismaTable } from "@/lib/prisma/errors";

export type ApiErrorShape = {
  error: string;
  code: string;
  status: number;
};

export function apiError(error: unknown, fallback = "request_failed", status = 500) {
  if (error instanceof Response) return error;
  if (isMissingPrismaTable(error)) {
    return Response.json(
      {
        error: "Database tables are not created yet. Run `npx prisma db push` after rotating your Supabase secrets.",
        code: "database_not_migrated",
        status: 503,
      } satisfies ApiErrorShape,
      { status: 503 },
    );
  }
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: error.issues[0]?.message ?? "Invalid request",
        code: "validation_error",
        status: 400,
      },
      { status: 400 },
    );
  }
  return Response.json(
    {
      error: error instanceof Error ? error.message : fallback,
      code: fallback,
      status,
    } satisfies ApiErrorShape,
    { status },
  );
}
