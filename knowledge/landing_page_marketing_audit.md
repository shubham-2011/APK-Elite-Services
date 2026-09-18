# Landing Page Marketing Audit — Senior Marketing Manager Review

**Date:** 2026-07-08 · **Page audited:** https://www.apkeliteservices.in/ (homepage)
**Basis:** Scored against the three personas in `web_development_and_persona_guide.md`
(A: Busy Homeowner · B: Facility Manager · C: Builder/Post-Construction)

**Verdict:** Technically healthy, but as a *selling tool* it under-performs. It describes
the company instead of persuading the customer, buries its best argument at the bottom,
offers zero proof for 15+ claims, and effectively speaks to only one of three personas.

---

## 1. The seven audits marketers run on any website

1. **Messaging & positioning audit** — the "5-second test": can a stranger tell in 5
   seconds *what you do, where, and why you over alternatives*? Is the differentiator
   above the fold or buried?
2. **Conversion (CRO) audit** — walk the page as each persona: is there one obvious next
   step? Do competing buttons dilute it? How many taps from landing to enquiry?
3. **Trust & credibility audit** — for every claim ask "says who?" Reviews, real photos,
   numbers, certificates, guarantees. Claims without proof are wallpaper.
4. **Content & SEO audit** — does content match what people search for (price, locality,
   duration), or only what the company wants to say?
5. **UX & mobile audit** — visual hierarchy, readability over images, scroll length,
   thumb reach. Mobile-first: that's where local-service traffic lives.
6. **Measurement audit** — can you see which pages produce enquiries? Without this,
   every other audit is guesswork.
7. **Competitive audit** — side-by-side vs Urban Company / Dirtblaster: what do they
   show that we don't? (Prices, ratings, locality pages.)

---

## 2. Findings for apkeliteservices.in

### 2.1 Hero fails the 5-second test (most expensive problem)
- Headline is the company name ("WELCOME TO APK Elite Services") — not a value
  proposition. No location, no outcome, no proof element (rating / jobs done / badge).
- On mobile the "WELCOME TO" eyebrow is barely legible over the busy photo.
- **CTA priority is backwards**: "Our Services" (navigation) gets the solid primary
  button; "Book a Consultation" (the money action) is styled secondary.
- "Consultation" is corporate-speak; homeowners think *quote*.

### 2.2 Best argument buried at page bottom
- The anti-aggregator strip ("Unlike standard aggregators… 100% in-house,
  background-verified team", eco-friendly, insured, guarantee, locality names) is the
  strongest copy on the site — and it is the LAST section, below Mission & Vision.
- Mission & Vision occupy prime mid-page space; customers don't read mission statements
  before buying. Move to About page.

### 2.3 Claims without proof
- "Why Choose" section: 15 claims in a scroll-box (a mobile anti-pattern), many
  near-duplicates ("Error-Free Service", "No Delays", "Immaculate Standards"), none
  evidenced.
- **Zero social proof site-wide**: no reviews, ratings, client names, before/after
  photos (testimonials section was deleted from the repo). In cleaning services,
  social proof IS the product.

### 2.4 Persona scorecard
| Persona | Score | Why |
|---|---|---|
| A — Busy Homeowner | 6/10 | WhatsApp/call CTAs + sticky mobile bar good; no reviews, no prices, stock-looking photos |
| B — Facility Manager | 3/10 | No commercial block: nothing on AMC contracts, after-hours scheduling, GST billing, insurance/compliance, no corporate-quote path |
| C — Builder | 3/10 | Post-construction is card #6 of 12, same billing as gardening; no before/after gallery, no turnaround promise, no case study |

- Structural cause: 12 equal-weight service cards — revenue drivers (deep cleaning,
  sofa, pest control) get the same billing as gardening. Show 6 priority services with
  "from ₹—" pricing; tuck the rest behind "All services".

### 2.5 Other findings
- **No prices anywhere** while the About page promises "transparent, upfront
  starting-from prices" — inconsistency erodes trust; comparison shoppers default to
  Urban Company's visible pricing.
- **No service-area module** — localities (Baner, Wakad, Kharadi, Hinjewadi, PCMC)
  appear only in a bottom paragraph; should be a visible, linkable strip (feeds future
  locality pages).
- **No "How it works"** 3-step strip (WhatsApp us → get quote → we clean, guaranteed).
- **JSON-LD claims Facebook/Instagram profiles but page shows no social links** — if
  profiles are dead, remove from JSON-LD; if alive, link them.
- **Measurement is zero** — WhatsApp clicks untracked (open TODO), so nobody knows
  which section earns leads.

---

## 3. Prioritized fix list (impact order)

1. **Rewrite hero**: benefit + city + proof ("Pune's In-House Deep Cleaning & Pest
   Control Experts — background-verified staff, 100% satisfaction guarantee");
   WhatsApp = solid primary button labelled "Get a Free Quote on WhatsApp".
2. **Move anti-aggregator block to slot #2**; demote Mission/Vision to About page.
3. **Add social-proof section** — 3 named testimonials with localities to start;
   replace with Google reviews once GBP is live.
4. **Restructure services**: 6 priority cards with "from ₹—" prices; add a
   "For Offices & Builders" dual-CTA strip for personas B and C.
5. **Cut "Why Choose" 15 → 5 claims with proof**; remove the scroll-box.
6. **Add WhatsApp click tracking** (Umami events) so the next audit runs on data.

Related docs: `SEO-AUDIT-REPORT.md` (technical audit + competitors), `TODO.md`
(pending actions), `knowledge/web_development_and_persona_guide.md` (personas).
