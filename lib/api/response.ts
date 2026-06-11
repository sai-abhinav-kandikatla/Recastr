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
        error: "Service unavailable. Try again later.",
        code: "service_unavailable",
        status: 503,
      } satisfies ApiErrorShape,
      { status: 503 },
    );
  }
  if (error instanceof ZodError) {
    return Response.json(
      {
        error: "Invalid request",
        code: "validation_error",
        status: 400,
      },
      { status: 400 },
    );
  }
  return Response.json(
    {
      error: status >= 500 ? "Request failed. Try again later." : "Invalid request",
      code: fallback,
      status,
    } satisfies ApiErrorShape,
    { status },
  );
}
