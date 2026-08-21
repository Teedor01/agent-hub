const BASE_URL = "https://8004scan.io/api/v1/public";

export interface EightThousandFourScanAgent {
  agent_id: string; 
  token_id: string;
  chain_id: number;
  contract_address: string;
  owner_address: string;
  name: string;
  description: string;
  image_url: string | null;
  is_verified: boolean;
  supported_protocols: string[];
  x402_supported: boolean;
  total_score: number;
  total_feedbacks: number;
  average_score: number;
  created_at: string; 
  updated_at: string;
}

interface EightThousandFourScanListResponse {
  success: boolean;
  data: EightThousandFourScanAgent[];
  meta: { pagination: { page: number; limit: number; total: number; hasMore: boolean } };
}

interface EightThousandFourScanSingleResponse {
  success: boolean;
  data: EightThousandFourScanAgent;
}

function apiKey(): string {
  const key = process.env.EIGHT004SCAN_API_KEY;
  if (!key) throw new Error("EIGHT004SCAN_API_KEY is not set");
  return key;
}

async function request<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-API-Key": apiKey() },
  });
  if (!res.ok) {
    throw new Error(`8004scan request failed: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(`8004scan returned an error: ${JSON.stringify(json.error)}`);
  }
  return json;
}


export async function getAgent(chainId: number, tokenId: string | number): Promise<EightThousandFourScanAgent> {
  const { data } = await request<EightThousandFourScanSingleResponse>(`/agents/${chainId}/${tokenId}`);
  return data;
}


export async function listAgentsByChain(
  chainId: number,
  opts?: { limit?: number; page?: number }
): Promise<{ agents: EightThousandFourScanAgent[]; total: number; hasMore: boolean }> {
  const limit = opts?.limit ?? 50;
  const page = opts?.page ?? 1;
  const { data, meta } = await request<EightThousandFourScanListResponse>(
    `/agents?chainId=${chainId}&limit=${limit}&page=${page}`
  );
  return { agents: data, total: meta.pagination.total, hasMore: meta.pagination.hasMore };
}


export async function searchAgents(query: string): Promise<EightThousandFourScanAgent[]> {
  const { data } = await request<EightThousandFourScanListResponse>(
    `/agents/search?q=${encodeURIComponent(query)}`
  );
  return data;
}
