import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const agent = await prisma.agent.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      dataSource: true,
      erc8004Verified: true,
      altanaEnabled: true,
      altanaContractLabel: true,
      altanaSpendCapWei: true,
      altanaSessionDurationSeconds: true,
    },
  });
  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(agent);
}
