/** Only display the API's public error fields; never serialize the full response. */
function publicMessage(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return;
  const body = data as Record<string, any>;
  const candidates = [body.message, typeof body.error === 'string' ? body.error : body.error?.message];
  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) return value.trim().slice(0, 500);
  }
}

export class HttpFailure extends Error {
  readonly code?: string;
  constructor(readonly status: number, data?: unknown) {
    super(publicMessage(data) || `MomoAI 请求失败（HTTP ${status}）`);
    this.name = 'HttpFailure';
    const code = data && typeof data === 'object' ? (data as any).code : undefined;
    if (typeof code === 'string') this.code = code;
  }
}

export async function readJson(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data || data.success === false) throw new HttpFailure(response.status, data);
  return data;
}
