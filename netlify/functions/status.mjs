import { getStore } from "@netlify/blobs";

export default async (req) => {
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^j[a-z0-9]{1,30}$/.test(id)) return Response.json({ error: "id" }, { status: 400 });
  const m = await getStore("jobs").get(`${id}/meta`, { type: "json" });
  if (!m) return Response.json({ error: "nema" }, { status: 404 });
  return Response.json({ status: m.status, koraci: m.koraci || {}, link: m.link || "", poruka: m.poruka || "" });
};

export const config = { path: "/api/status" };
