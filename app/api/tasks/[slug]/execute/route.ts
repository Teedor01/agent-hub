import { NextRequest, NextResponse } from "next/server";
import { runVenusHealthTask } from "@/lib/tasks/venus-health";
import { runVenusYieldTask } from "@/lib/tasks/venus-yield";
import { runPancakeGridTask } from "@/lib/tasks/pancake-grid";


const WALLET_REQUIRED_SLUGS = new Set(["agentcensus-health-factor-monitor", "stableyield"]);
const IMPLEMENTED_SLUGS = new Set(["agentcensus-health-factor-monitor", "stableyield", "rangebot"]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!IMPLEMENTED_SLUGS.has(slug)) {
    return NextResponse.json(
      { error: `No task implementation wired for "${slug}" yet.` },
      { status: 501 }
    );
  }

  let body: { wallet?: string; tokenA?: string; tokenB?: string; gridRangePercent?: number; gridLevels?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }


  if (WALLET_REQUIRED_SLUGS.has(slug) && (!body.wallet || typeof body.wallet !== "string")) {
    return NextResponse.json({ error: "Missing required field: wallet" }, { status: 400 });
  }

 
  let result;
  if (slug === "agentcensus-health-factor-monitor") {
    result = await runVenusHealthTask(body.wallet as string);
  } else if (slug === "stableyield") {
    result = await runVenusYieldTask(body.wallet as string);
  } else {
    result = await runPancakeGridTask({
      wallet: body.wallet,
      tokenA: body.tokenA,
      tokenB: body.tokenB,
      gridRangePercent: body.gridRangePercent,
      gridLevels: body.gridLevels,
    });
  }

  return NextResponse.json(result);
}
