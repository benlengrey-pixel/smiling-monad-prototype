import { buildGatewayRequest } from "@/lib/ai/gateway";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return Response.json(
        { error: "OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const gatewayRequest = buildGatewayRequest(
      body.message || "",
      {
        currentTask: body.currentTask,
        memory: body.memory,
        subscriptionTier: body.subscriptionTier || "free",
        availableTools: body.availableTools || [],
        approvedActions: body.approvedActions || [],

        userName: body.userName,
        mode: body.mode || "personal",
        circleName: body.circleName,
        circleCentre: body.circleCentre,
        session: body.session,
      }
    );

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || "gpt-5",
          instructions: gatewayRequest.instructions,
          input: gatewayRequest.prompt,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error:
            data?.error?.message ||
            "External AI request failed.",
        },
        { status: response.status }
      );
    }

    const text =
      data.output_text ||
      data.output
        ?.flatMap(
          (item: {
            content?: Array<{
              type?: string;
              text?: string;
            }>;
          }) => item.content || []
        )
        .filter(
          (item: { type?: string }) =>
            item.type === "output_text"
        )
        .map(
          (item: { text?: string }) =>
            item.text || ""
        )
        .join("") ||
      "No response returned.";

    return Response.json({
      success: true,
      response: text,
    });
  } catch {
    return Response.json(
      { error: "Unable to contact the external AI." },
      { status: 500 }
    );
  }
}
