import { createClient, BNB_TESTNET, signerFromPrivateKey } from "@altananetwork/sdk";


function ownerPrivateKey(): `0x${string}` {
  const key = process.env.ALTANA_OWNER_PRIVATE_KEY;
  if (!key) throw new Error("ALTANA_OWNER_PRIVATE_KEY is not set");
  if (!key.startsWith("0x")) throw new Error("ALTANA_OWNER_PRIVATE_KEY must be 0x-prefixed");
  return key as `0x${string}`;
}

export function altanaEnabled(): boolean {
  return process.env.ALTANA_ENABLED === "true" && !!process.env.ALTANA_OWNER_PRIVATE_KEY;
}

let cachedClient: ReturnType<typeof createClient> | null = null;
function getClient() {
  if (!cachedClient) cachedClient = createClient({ chains: [BNB_TESTNET] });
  return cachedClient;
}

export interface HireSessionResult {
  sessionPublicKey: string;
  txHash: string;
  walletAddress: string;
  spendCapWei: string;
  expiresAt: number;
}

exercise -- do not widen this to "allow everything".
 */
export async function hireAgentWithSession(params: {
  allowedContract: `0x${string}`;
  spendCapWei: bigint;
  expirySeconds: number; 
  proofSelector?: `0x${string}`;
}): Promise<HireSessionResult> {
  const client = getClient();
  const signer = signerFromPrivateKey(ownerPrivateKey());
  const wallet = await client.createWallet({ signer });

  const expiry = Math.floor(Date.now() / 1000) + params.expirySeconds;

  const session = await client.grantSession({
    wallet,
    signer: wallet.signer,
    permissions: {
      calls: [{ to: params.allowedContract }],
      spend: [{ limit: params.spendCapWei, period: "day" }],
    },
    expiry,
  });


  const proofSelector = params.proofSelector ?? "0xf851a440"; 

  const result = await client.execute({
    session,
    calls: [{ to: params.allowedContract, data: proofSelector, value: BigInt(0) }],
  });

  if (!result.transactionHash) {
    throw new Error(`Altana execute() did not return a transaction hash (status: ${result.status})`);
  }

  return {
    sessionPublicKey: session.publicKey,
    txHash: result.transactionHash,
    walletAddress: wallet.address,
    spendCapWei: params.spendCapWei.toString(),
    expiresAt: expiry,
  };
}

export async function revokeAgentSession(sessionPublicKey: string): Promise<{ txHash: string | null }> {
  const client = getClient();
  const signer = signerFromPrivateKey(ownerPrivateKey());
  const wallet = await client.createWallet({ signer });
  const result = await client.revokeSession({
    wallet,
    signer,
    session: sessionPublicKey as `0x${string}`,
  });
  return { txHash: result.transactionHash ?? null };
}
