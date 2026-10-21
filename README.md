# Gromix Vizitka

Forma (public/index.html) prima podatke, slike i glas (snima se u browseru, čuva kao WAV).
Netlify funkcije čuvaju unos u Netlify Blobs. Admin strana (public/admin.html) služi za pregled unosa,
preuzimanje fajlova i upis rezultata (link, koraci), koji se odmah vidi u formi uz QR kod.

## Postavljanje
1. Stavi folder na GitHub i poveži ga na Netlify (Add new site > Import from Git). Funkcije traže build, pa ne radi ručno prevlačenje foldera.
   Alternativa: `npm i -g netlify-cli && npm i && netlify deploy --prod`.
2. U Netlify: Site configuration > Environment variables > dodaj `ADMIN_TOKEN` (bar 12 znakova, nasumično).
3. Otvori `/` za formu i `/admin.html` za admin (traži token).

## Ograničenja
- Netlify funkcije primaju do oko 6 MB po zahtevu. Slike se smanjuju u browseru, a glas se snima mono 24 kHz (oko 3 MB za 60 s).
- Obrada na Gromixu je trenutno ručna (Claude kroz browser). Rezultat se upisuje u admin strani.
