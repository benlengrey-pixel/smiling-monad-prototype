export type GatewayResponse = {
  action: "draft" | "clarify" | "answer";
  application:
    | "shift-report"
    | "correspondence"
    | "notes"
    | "planning"
    | "general";
  title: string;
  question: string;
  content: string;
  error?: string;
};

export async function sendGatewayRequest(
  request: string,
  memory: string
): Promise<GatewayResponse> {
  const response = await fetch("/api/gateway", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      request,
      memory,
    }),
  });

  const data = (await response.json()) as GatewayResponse;

  if (!response.ok) {
    throw new Error(data.error || "The Companion could not respond.");
  }

  return data;
}
