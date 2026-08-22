import { NextRequest, NextResponse } from "next/server";
import { classifyIntent } from "@/lib/copilot/intent";
import { listAgents } from "@/lib/agents/repository";
import { rankAgents } from "@/lib/ranking/engine";
import { explainRecommendation } from "@/lib/copilot/explain";

export async function POST(req: NextRequest) {
  const { text } = await req.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
  }

 
  const intent = classifyIntent(text);
  if (!intent.category) {
    return NextResponse.json({
      intent,
      message:
        "I couldn't map that to a category yet. AgentHub currently covers rebalancing, grid trading, yield optimization, and health factor monitoring — try describing your goal in those terms.",
      evidence: [],
      agents: [],
    });
  }


  const agents = await listAgents({ category: intent.category });


  const evidence = rankAgents(agents);

 
  const message = await explainRecommendation({ userText: text, agents, evidence });

  return NextResponse.json({ intent, message, evidence, agents });
}
