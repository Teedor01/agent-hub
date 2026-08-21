import { AgentSummary, RecommendationEvidence } from "@/types/domain";



export async function explainRecommendation(params: {
  userText: string;
  agents: AgentSummary[];
  evidence: RecommendationEvidence[];
}): Promise<string> {
  const { userText, agents, evidence } = params;
  const top = evidence[0];
  const topAgent = agents.find((a) => a.id === top?.agentId);

  if (!topAgent || !top) {
    return "I couldn't find an agent that matches that request yet. Try describing it differently, or browse by category.";
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return templateExplanation(topAgent, top, agents, evidence);
  }

  const prompt = buildGroundedPrompt(userText, agents, evidence);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return templateExplanation(topAgent, top, agents, evidence);
    const data = (await res.json()) as { content?: Array<{ type: string; text?: string }> };
    const text = data.content?.find((c) => c.type === "text")?.text;
    return text ?? templateExplanation(topAgent, top, agents, evidence);
  } catch {
    
    return templateExplanation(topAgent, top, agents, evidence);
  }
}

function buildGroundedPrompt(userText: string, agents: AgentSummary[], evidence: RecommendationEvidence[]): string {
  return [
    "You are explaining an AI agent marketplace recommendation to a user.",
    "You must ONLY use the facts provided below. Do not invent any metric, name, price, or claim not listed here.",
    "",
    `User request: "${userText}"`,
    "",
    "Ranked candidates (already scored and ordered — do not re-rank):",
    JSON.stringify(
      evidence.map((e) => ({
        agent: agents.find((a) => a.id === e.agentId)?.name,
        score: e.score,
        reasons: e.reasons,
        tradeoffs: e.tradeoffs,
      })),
      null,
      2
    ),
    "",
    "Write 2-4 sentences recommending the top candidate and briefly noting how it compares to the runner-up, if any. Plain language, no markdown headers.",
  ].join("\n");
}

function templateExplanation(
  topAgent: AgentSummary,
  top: RecommendationEvidence,
  agents: AgentSummary[],
  evidence: RecommendationEvidence[]
): string {
  const parts: string[] = [];
  parts.push(`I recommend ${topAgent.name} (trust score ${top.score}/100).`);
  if (top.reasons.length) parts.push(top.reasons.join(", ") + ".");
  if (top.tradeoffs.length) parts.push(`Worth knowing: ${top.tradeoffs.join(", ")}.`);

  const runnerUpEvidence = evidence[1];
  const runnerUp = runnerUpEvidence && agents.find((a) => a.id === runnerUpEvidence.agentId);
  if (runnerUp && runnerUpEvidence) {
    parts.push(`${runnerUp.name} is also a reasonable alternative (score ${runnerUpEvidence.score}/100).`);
  }

  return parts.join(" ");
}
