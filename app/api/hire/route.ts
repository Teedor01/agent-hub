import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { altanaEnabled, hireAgentWithSession } from "@/lib/altana/client";

export async function POST(req: NextRequest) {
  const { agentId } = await req.json();
  if (!agentId) return NextResponse.json({ error: "Missing agentId" }, { status: 400 });

  const agent = await prisma.agent.findUnique({ where: { id: agentId } });
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });


  const canUseAltana =
    agent.altanaEnabled &&
    agent.altanaAllowedContract &&
    agent.altanaSpendCapWei &&
    agent.altanaSessionDurationSeconds &&
    altanaEnabled(); // env-level kill switch -- both must be true

  if (canUseAltana) {
    try {
      const result = await hireAgentWithSession({
        allowedContract: agent.altanaAllowedContract as `0x${string}`,
        spendCapWei: BigInt(agent.altanaSpendCapWei!),
        expirySeconds: agent.altanaSessionDurationSeconds!,
      });

      const hire = await prisma.hire.create({
        data: {
          agentId: agent.id,
          status: "ONCHAIN",
          txHash: result.txHash,
          altanaSessionId: result.sessionPublicKey,
          altanaWalletAddress: result.walletAddress,
          spendCapWei: result.spendCapWei,
          sessionExpiresAt: new Date(result.expiresAt * 1000),
        },
      });

      return NextResponse.json({ hire });
    } catch (err) {
      console.error("Altana hire failed:", err);
      return NextResponse.json(
        { error: "Real onchain hire failed. Check server logs and Altana testnet wallet funding." },
        { status: 502 }
      );
    }
  }

  const hire = await prisma.hire.create({
    data: {
      agentId: agent.id,
      status: "SIMULATED",
      txHash: null,
    },
  });

  return NextResponse.json({ hire });
}
