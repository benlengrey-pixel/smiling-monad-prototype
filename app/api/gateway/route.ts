import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();

  return NextResponse.json({
    intent: "unknown",
    needsClarification: false,
    question: "",
    title: "AI Gateway Test",
    document: `You asked: ${body.request || ""}`,
  });
}