import { getStore } from "@netlify/blobs";

const ok = (req) => {
  const t = process.env.ADMIN_TOKEN || "";
  return t.length >= 12 && req.headers.get("x-admin-token") === t;
};

export default async (req) => {
  if (!ok(req)) return new Response("Unauthorized", { status: 401 });
  const store = getStore("jobs");
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";

  if (req.method === "GET" && !id) {
    const { blobs } = await store.list();
    const metas = [];
    for (const b of blobs.filter((x) => x.key.endsWith("/meta"))) {
      const m = await store.get(b.key, { type: "json" });
      if (m) metas.push(m);
    }
    metas.sort((a, b) => b.kreirano - a.kreirano);
    return Response.json(metas);
  }
  if (!/^j[a-z0-9]{1,30}$/.test(id)) return new Response("Bad id", { status: 400 });

  if (req.method === "GET") {
    const file = url.searchParams.get("file");
    if (!file) return Response.json(await store.get(`${id}/meta`, { type: "json" }));
    if (!["foto", "glas", "vizitka"].includes(file)) return new Response("Bad file", { status: 400 });
    const r = await store.getWithMetadata(`${id}/${file}`, { type: "arrayBuffer" });
    if (!r) return new Response("Not found", { status: 404 });
    return new Response(r.data, { headers: { "content-type": r.metadata?.type || "application/octet-stream" } });
  }

  if (req.method === "POST") {
    const m = await store.get(`${id}/meta`, { type: "json" });
    if (!m) return new Response("Not found", { status: 404 });
    const p = await req.json();
    for (const k of ["status", "link", "poruka"]) if (typeof p[k] === "string") m[k] = p[k].slice(0, 500);
    if (p.koraci && typeof p.koraci === "object") m.koraci = { ...m.koraci, ...p.koraci };
    await store.setJSON(`${id}/meta`, m);
    return Response.json(m);
  }
  return new Response("Method not allowed", { status: 405 });
};

export const config = { path: "/api/admin" };
