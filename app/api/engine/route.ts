import { decide } from "@/lib/engine";

export async function POST(request: Request) {
  const body = await request.json();

  const decision = decide({
    request: body.request || "",
  });

  return Response.json(decision);
}
