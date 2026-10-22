import { getStore } from "@netlify/blobs";

const MAX_TOTAL = 5.5 * 1024 * 1024; // Netlify funkcije primaju do ~6 MB
const clip = (v, n) => String(v ?? "").trim().slice(0, n);

export default async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  let fd;
  try { fd = await req.formData(); } catch { return Response.json({ error: "Neispravan zahtev" }, { status: 400 }); }
  if (fd.get("website_hp")) return Response.json({ id: "j0" }); // honeypot

  const files = {};
  let total = 0;
  for (const k of ["logo", "foto", "glas", "vizitka"]) {
    const f = fd.get(k);
    if (f && typeof f === "object" && f.size) { files[k] = f; total += f.size; }
  }
  if (total > MAX_TOTAL) return Response.json({ error: "Fajlovi su preveliki. Smanji sliku ili skrati glas." }, { status: 413 });

  const ime = clip(fd.get("ime"), 120);
  if (!ime) return Response.json({ error: "Ime je obavezno" }, { status: 400 });

  const id = "j" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const store = getStore("jobs");
  const have = {};
  for (const [k, f] of Object.entries(files)) {
    await store.set(`${id}/${k}`, await f.arrayBuffer(), { metadata: { type: f.type || "application/octet-stream", name: f.name || k } });
    have[k] = { type: f.type, size: f.size };
  }
  await store.setJSON(`${id}/meta`, {
    id, status: "novo", kreirano: Date.now(),
    ime, titula: clip(fd.get("titula"), 120), firma: clip(fd.get("firma"), 120),
    tel: clip(fd.get("tel"), 60), mail: clip(fd.get("mail"), 120), web: clip(fd.get("web"), 200),
    adresa: clip(fd.get("adresa"), 200), o: clip(fd.get("o"), 4000),
    fajlovi: have, koraci: {}, link: "", poruka: ""
  });
  return Response.json({ id });
};

export const config = { path: "/api/submit" };
