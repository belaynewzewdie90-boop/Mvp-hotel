import { kv } from "@vercel/kv";

export const config = { runtime: "nodejs" };

const KEY = "hotel-management-system-data";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const data = await kv.get(KEY);
    return res.status(200).json({ data: data ?? null });
  }

  if (req.method === "POST") {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    if (!body || !("data" in body)) {
      return res.status(400).json({ error: "expected { data }" });
    }
    await kv.set(KEY, body.data);
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: "method not allowed" });
}
