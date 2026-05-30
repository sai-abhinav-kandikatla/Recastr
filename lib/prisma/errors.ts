export function isMissingPrismaTable(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code?: unknown }).code) : "";
  const message = error instanceof Error ? error.message : "";
  return code === "P2021" || code === "P2022" || /table .* does not exist/i.test(message);
}

export function isLocalDatabaseSetupError(error: unknown) {
  return process.env.NODE_ENV !== "production" && isMissingPrismaTable(error);
}
