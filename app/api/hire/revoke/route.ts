import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { revokeAgentSession } from "@/lib/altana/client";

export async function POST(req: NextRequest) {
  const { hireId } = await req.json();
  if (!hireId) return NextResponse.json({ error: "Missing hireId" }, { status: 400 });

  const hire = await prisma.hire.findUnique({ where: { id: hireId } });
  if (!hire) return NextResponse.json({ error: "Hire not found" }, { status: 404 });
  if (hire.status !== "ONCHAIN" || !hire.altanaSessionId) {
    return NextResponse.json({ error: "This hire has no real onchain session to revoke" }, { status: 400 });
  }
  if (hire.revokedAt) {
    return NextResponse.json({ error: "Already revoked" }, { status: 400 });
  }

  try {
    const result = await revokeAgentSession(hire.altanaSessionId);
    const updated = await prisma.hire.update({
      where: { id: hireId },
      data: { revokedAt: new Date() },
    });
    return NextResponse.json({ hire: updated, revokeTxHash: result.txHash });
  } catch (err) {
    console.error("Altana revoke failed:", err);
    return NextResponse.json({ error: "Revocation failed. Check server logs." }, { status: 502 });
  }
}
