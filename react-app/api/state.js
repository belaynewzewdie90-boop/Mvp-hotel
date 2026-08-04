import { kv } from "@vercel/kv";

export const config = { runtime: "nodejs" };

const KEY = "hotel-management-system-data";

export default async function handler(req, res) {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    return res.status(500).json({
      error:
        "Vercel KV is not connected. Create a KV database in Storage and connect it to this project, then redeploy.",
    });
  }

  try {
    if (req.method === "GET") {
      const data = await kv.get(KEY);
      return res.status(200).json({ data: data ?? null });
    }

    if (req.method === "POST") {
      const body =
        typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      if (!body || !("data" in body)) {
        return res.status(400).json({ error: "expected { data }" });
      }
      await kv.set(KEY, body.data);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: "method not allowed" });
  } catch (err) {
    return res.status(500).json({ error: String(err && err.message) });
  }
}
