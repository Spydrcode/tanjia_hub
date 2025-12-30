import { tanjiaServerConfig } from "@/lib/tanjia-config";

type HttpMethod = "GET" | "POST";

type CalRequestOptions = {
  method?: HttpMethod;
  path: string;
  body?: unknown;
};

export type CalSlotParams = {
  eventSlug: string;
  startTime?: string;
  endTime?: string;
};

export async function calRequest<T = unknown>({ method = "GET", path, body }: CalRequestOptions): Promise<T> {
  if (!tanjiaServerConfig.calApiKey) {
    throw new Error("CAL_API_KEY is not configured.");
  }

  const url = `${tanjiaServerConfig.calApiBaseUrl.replace(/\/+$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${tanjiaServerConfig.calApiKey}`,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cal API error (${res.status}): ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function fetchCalSlots(params: CalSlotParams) {
  const query = new URLSearchParams();
  if (params.startTime) query.set("startTime", params.startTime);
  if (params.endTime) query.set("endTime", params.endTime);
  const path = `/v2/event-types/${params.eventSlug}/slots?${query.toString()}`;
  return calRequest<{ slots: unknown[] }>({ path });
}
