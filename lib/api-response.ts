export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string } };

export function ok<T>(data: T): Response {
  return Response.json({ data, error: null } satisfies ApiResponse<T>);
}

export function err(message: string, code: string, status = 400): Response {
  return Response.json(
    { data: null, error: { message, code } } satisfies ApiResponse<never>,
    { status },
  );
}
