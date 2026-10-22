import { getStore } from "@netlify/blobs";

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hue = (id) => { let h = 0; for (const c of id) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const telClean = (t) => String(t || "").replace(/[^\d+]/g, "");
const webUrl = (w) => (/^https?:\/\//i.test(w) ? w : "https://" + w);

export default async (req) => {
  const u = new URL(req.url);
  const parts = u.pathname.replace(/^\/v\//, "").split("/").filter(Boolean);
  const id = parts[0] || "";
  const sub = parts[1] || "";
  if (!/^j[a-z0-9]{1,30}$/.test(id)) return new Response("Nema takve vizitke", { status: 404 });
  const store = getStore("jobs");
  const m = await store.get(`${id}/meta`, { type: "json" });
  if (!m || !m.link) return new Response("Vizitka još nije gotova", { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } });

  if (sub === "logo") {
    const r = await store.getWithMetadata(`${id}/logo`, { type: "arrayBuffer" });
    if (!r) return new Response("", { status: 404 });
    return new Response(r.data, { headers: { "content-type": r.metadata?.type || "image/png", "cache-control": "public, max-age=3600" } });
  }

  const h = hue(id);
  const accent = `hsl(${h} 70% 45%)`;
  const hasLogo = !!(m.fajlovi && m.fajlovi.logo);

  if (sub === "manifest.webmanifest") {
    return Response.json({
      name: m.ime, short_name: (m.ime || "Vizitka").split(" ")[0], start_url: `/v/${id}`, scope: `/v/${id}`,
      display: "standalone", background_color: "#ffffff", theme_color: accent,
      icons: hasLogo ? [{ src: `/v/${id}/logo`, sizes: "512x512", type: "image/png", purpose: "any" }] : []
    }, { headers: { "content-type": "application/manifest+json" } });
  }

  if (sub === "kontakt.vcf") {
    const p = String(m.ime || "").trim().split(/\s+/);
    const vcf = ["BEGIN:VCARD", "VERSION:3.0", `N:${p.slice(1).join(" ")};${p[0] || ""};;;`, `FN:${m.ime}`,
      m.firma ? `ORG:${m.firma}` : "", m.titula ? `TITLE:${m.titula}` : "", m.tel ? `TEL;TYPE=CELL:${m.tel}` : "",
      m.mail ? `EMAIL:${m.mail}` : "", m.web ? `URL:${webUrl(m.web)}` : "", m.adresa ? `ADR:;;${m.adresa};;;;` : "", "END:VCARD"].filter(Boolean).join("\r\n");
    return new Response(vcf, { headers: { "content-type": "text/vcard; charset=utf-8", "content-disposition": `attachment; filename="${(m.ime || "kontakt").replace(/[^\w]+/g, "-")}.vcf"` } });
  }

  const rows = [];
  if (m.tel) rows.push(["Pozovi", m.tel, `tel:${telClean(m.tel)}`, "M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z"]);
  if (m.mail) rows.push(["Pošalji mejl", m.mail, `mailto:${m.mail}`, "M20 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 4-8 5-8-5V6l8 5 8-5z"]);
  if (m.web) rows.push(["Sajt", m.web.replace(/^https?:\/\//i, ""), webUrl(m.web), "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.93 6h-2.95a15.65 15.65 0 0 0-1.38-3.56A8.03 8.03 0 0 1 18.93 8zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14a8.2 8.2 0 0 1 0-4h3.38a16.5 16.5 0 0 0 0 4H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56A7.99 7.99 0 0 1 5.08 16zm2.95-8H5.08a7.99 7.99 0 0 1 4.33-3.56A15.65 15.65 0 0 0 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66a14.7 14.7 0 0 1 0-4h4.68a14.7 14.7 0 0 1 0 4zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95a8.03 8.03 0 0 1-4.33 3.56zM16.36 14a16.5 16.5 0 0 0 0-4h3.38a8.2 8.2 0 0 1 0 4h-3.38z"]);
  if (m.adresa) rows.push(["Lokacija", m.adresa, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.adresa)}`, "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z"]);

  const rowHtml = rows.map((r) => `<a class="row" href="${esc(r[2])}"${r[0] === "Sajt" || r[0] === "Lokacija" ? ' target="_blank" rel="noopener"' : ""}><span class="ic"><svg viewBox="0 0 24 24"><path d="${r[3]}"/></svg></span><span class="tx"><small>${esc(r[0])}</small><b>${esc(r[1])}</b></span></a>`).join("");
  const mono = esc(((m.firma || m.ime || "?").trim().split(/\s+/).slice(0, 2).map((x) => x[0]).join("") || "?").toUpperCase());

  const html = `<!doctype html><html lang="sr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(m.ime)}</title><meta name="theme-color" content="${accent}">
<link rel="manifest" href="/v/${id}/manifest.webmanifest">
<meta name="apple-mobile-web-app-capable" content="yes"><meta name="mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="${esc((m.ime || "").split(" ")[0])}">
${hasLogo ? `<link rel="apple-touch-icon" href="/v/${id}/logo"><link rel="icon" href="/v/${id}/logo">` : ""}
<style>
:root{--a:${accent};--ad:hsl(${h} 55% 12%);--bg:#f4f6f8;--ink:#0d1117;--mut:#5b6573}
*{box-sizing:border-box}body{margin:0;font:16px/1.4 system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:var(--bg);color:var(--ink);padding-bottom:max(24px,env(safe-area-inset-bottom))}
.top{background:linear-gradient(160deg,var(--ad),var(--a));color:#fff;padding:max(20px,env(safe-area-inset-top)) 22px 150px;text-align:center}
.logo{width:80px;height:80px;margin:0 auto 12px;border-radius:22px;background:#fff;border-radius:28px;display:grid;place-items:center;box-shadow:0 14px 34px rgba(0,0,0,.28);overflow:hidden;padding:14px}
.logo img{max-width:100%;max-height:100%;object-fit:contain;display:block}.logo span{font-size:42px;font-weight:800;color:var(--a)}
h1{margin:0;font-size:24px;line-height:1.15}.t{margin:6px 0 0;opacity:.92}.f{margin:2px 0 0;font-weight:700}
.card{max-width:520px;margin:-130px auto 0;padding:0 16px;display:grid;gap:12px}
.row{display:flex;gap:14px;align-items:center;background:#fff;border-radius:18px;padding:14px 16px;text-decoration:none;color:inherit;box-shadow:0 2px 10px rgba(16,24,40,.07)}
.ic{width:46px;height:46px;border-radius:14px;background:var(--a);display:grid;place-items:center;flex:none}.ic svg{width:24px;height:24px;fill:#fff}
.tx{min-width:0}.tx small{display:block;color:var(--mut);font-size:13px}.tx b{display:block;font-size:17px;overflow-wrap:anywhere}
.big{display:block;text-align:center;text-decoration:none;font-weight:800;font-size:18px;padding:17px;border-radius:18px;background:var(--ad);color:#fff}
.alt{background:#fff;color:var(--ad);box-shadow:inset 0 0 0 2px var(--ad)}
.qrfull{position:fixed;inset:0;z-index:50;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;padding:24px}.qrfull[hidden]{display:none}.qrfull .q{width:min(88vw,62vh,460px);aspect-ratio:1}.qrfull .q svg{width:100%;height:100%;display:block}.qrfull b{font-size:22px}.qrfull button{background:#111;color:#fff;border:0;border-radius:99px;padding:13px 28px;font:inherit;font-weight:800;cursor:pointer}
.qrc{display:block;width:100%;background:#fff;border:0;border-radius:24px;padding:20px 20px 14px;box-shadow:0 10px 30px rgba(0,0,0,.18);cursor:pointer;color:#555;font:inherit;font-size:13px}.qi{width:min(100%,300px);margin:0 auto 8px;aspect-ratio:1}.qi svg{width:100%;height:100%;display:block}
.hint{background:#fff;border-radius:18px;padding:14px 16px;font-size:14px;color:var(--mut);display:none}
.hint b{color:var(--ink)}
@media(prefers-color-scheme:dark){:root{--bg:#0b0e13;--ink:#f1f4f8;--mut:#9aa6b6}.row,.hint{background:#161b22}.alt{background:#161b22;color:#fff;box-shadow:inset 0 0 0 2px #2d3748}}
</style></head><body>
<div class="top"><div class="logo">${hasLogo ? `<img src="/v/${id}/logo" alt="">` : `<span>${mono}</span>`}</div><h1>${esc(m.ime)}</h1>${m.titula ? `<p class="t">${esc(m.titula)}</p>` : ""}${m.firma ? `<p class="f">${esc(m.firma)}</p>` : ""}</div>
<div class="card">
<button class="qrc" id="qrb" type="button" aria-label="Uvećaj QR kod"><div class="qi" id="qi"></div><span>Dodirni za ceo ekran</span></button>
<a class="big alt" href="${esc(m.link)}">▶ Otvori moju prezentaciju</a>
${rowHtml}
<a class="big alt" href="/v/${id}/kontakt.vcf">Sačuvaj kontakt u telefon</a>
<button class="big alt" id="inst" style="border:0;font:inherit;font-weight:800;cursor:pointer;display:none" type="button">Dodaj na početni ekran</button>
<div class="hint" id="ios"><b>Dodaj na početni ekran:</b> pritisni dugme za deljenje u Safariju (kvadrat sa strelicom), pa „Dodaj na početni ekran”.</div>
<div class="hint" id="and"><b>Dodaj na početni ekran:</b> otvori meni pregledača (tri tačke) pa „Dodaj na početni ekran”.</div>
</div>
<div class="qrfull" id="qf" hidden><div class="q" id="qq"></div><b>${esc(m.ime)}</b><button id="qx" type="button">Zatvori</button></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js"></script>
<script>
var wl=null;
function mk(){var q=qrcode(0,"M");q.addData(location.origin+"/v/${id}");q.make();return q.createSvgTag({cellSize:6,margin:0,scalable:true})}
try{document.getElementById("qi").innerHTML=mk()}catch(e){}
document.getElementById("qrb").onclick=async function(){document.getElementById("qq").innerHTML=mk();document.getElementById("qf").hidden=false;try{wl=await navigator.wakeLock.request("screen")}catch(e){}};
document.getElementById("qx").onclick=function(){document.getElementById("qf").hidden=true;try{wl&&wl.release()}catch(e){}};
var ua=navigator.userAgent,ios=/iPhone|iPad|iPod/.test(ua),standalone=window.matchMedia("(display-mode: standalone)").matches||navigator.standalone;
if(!standalone){if(ios)document.getElementById("ios").style.display="block";else document.getElementById("and").style.display="block"}
var dp=null;window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();dp=e;document.getElementById("and").style.display="none";var b=document.getElementById("inst");b.style.display="block";b.onclick=function(){dp.prompt()}});
</script></body></html>`;
  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-cache" } });
};

export const config = { path: ["/v/*"] };
