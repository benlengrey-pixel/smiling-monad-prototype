import { NextResponse } from "next/server";

let memory: unknown[] = [];

export async function POST(request: Request) {
  const body = await request.json();

  memory = body.memory ?? [];

  return NextResponse.json({
    success: true,
  });
}

export async function GET() {
  return NextResponse.json(memory);
}