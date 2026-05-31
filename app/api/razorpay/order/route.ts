export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const checkoutUrl = new URL("/api/razorpay/checkout", request.url);
  return fetch(checkoutUrl, {
    method: "POST",
    headers: request.headers,
    body: await request.text(),
  });
}
