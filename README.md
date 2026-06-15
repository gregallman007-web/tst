# Take Some Time

Marketing website for **Take Some Time** — home-visit pregnancy, postnatal and hot stone
massage with Kia Welham, across Chelmsford, Great Dunmow and mid-Essex.

A plain static site: hand-written HTML, one shared stylesheet (`site.css`) and a little
vanilla JavaScript (`site.js`, `bird-anim.js`). No build step, no framework, no dependencies.

## Pages

| File | Page |
|------|------|
| `index.html` | Home |
| `about.html` | About Kia |
| `services.html` | Treatments &amp; prices overview |
| `pregnancy-massage.html` · `postnatal-massage.html` · `hot-stone-massage.html` | Individual treatments |
| `pricing.html` | Prices |
| `reviews.html` | Reviews |
| `areas-covered.html` | Areas covered |
| `faqs.html` | FAQs |
| `gift-vouchers.html` | Gift vouchers (3D voucher card) |
| `mums-take-some-time.html` | Group sessions |
| `pregnancy-massage-chelmsford.html`, `mobile-massage-*.html` | Local landing pages |
| `contact.html` | Contact |
| `terms.html` · `privacy.html` | Legal |

Shared assets live in `images/`; the animated hero bird is `bird-anim.mp4`.

## Run locally

It's all static, so just open `index.html` in a browser — or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploy (GitHub Pages)

This repo ships with a Pages workflow at `.github/workflows/deploy.yml`.

1. Push this project to a GitHub repository (default branch **main**).
2. In the repo, go to **Settings → Pages**.
3. Under **Build and deployment → Source**, choose **GitHub Actions**.
4. Every push to `main` then builds and publishes automatically; the live URL appears
   in the **Actions** run and under **Settings → Pages**.

`.nojekyll` is included so Pages serves the files exactly as they are.

### Custom domain (optional)

To use `takesometime.co.uk`:

1. In **Settings → Pages → Custom domain**, enter the domain (this creates a `CNAME` file).
2. At your DNS provider, point the domain at GitHub Pages:
   - apex `takesometime.co.uk` → `A` records `185.199.108.153`, `185.199.109.153`,
     `185.199.110.153`, `185.199.111.153`
   - `www` → `CNAME` to `<your-username>.github.io`
3. Tick **Enforce HTTPS** once the certificate is issued.

## Still to wire up

- **WhatsApp buttons** — wired to `https://wa.me/447814657418` with a pre-filled message.
- **Photography** — several images are placeholders from the shoot; swap in final selects.
- **Legal pages** — `terms.html` / `privacy.html` are drafts; have them reviewed before launch.
