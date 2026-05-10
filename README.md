# aeTech Digital Hub — v0.2

A premium engineering studio website with full admin dashboard.

**Stack:** Next.js 16.2 · React 19.2 · TypeScript · Tailwind · MongoDB / Mongoose · **Auth.js v5** · Nodemailer · Termii / Twilio SMS · Recharts · Framer Motion · Lucide

---

## What changed in v0.2

- **Next.js 16.2** — async request APIs (`params`, `searchParams`, `cookies()`) — all dynamic routes already migrated
- **Auth.js v5** (formerly NextAuth) — single-file `auth.ts` at the root exporting `auth`, `signIn`, `signOut`, `handlers`
- **All prices now USD by default** — services, scoping recommendations, invoices
- **Live USD ↔ GHS exchange rate** — every USD price renders with `≈ GHS X` underneath, fetched hourly from open.er-api.com (with fawazahmed0/currency-api fallback)
- **Real logo wired in** — extracted from the letterhead, three variants (purple JPG, transparent PNG, light PNG for dark surfaces) in `public/`
- Admin email default switched to `ephraim@aetechdigitalhub.com`

---

## Quick start

```bash
# 1. Install
npm install

# 2. Copy env file & fill in values
cp .env.example .env.local

# 3. Generate auth secret (paste into AUTH_SECRET / NEXTAUTH_SECRET)
openssl rand -base64 32

# 4. Seed admin user + sample content
npm run seed

# 5. Run
npm run dev
```

Visit `http://localhost:3000`. Sign in at `/login` with the admin credentials from `.env.local`.

---

## What's built

### Public site
- Editorial homepage (Stripe-like aesthetic, Fraunces + Cormorant + Inter)
- Services index + 6 service detail pages with **live USD pricing + GHS equivalent**
- Projects gallery + case-study detail
- Research / blog with article pages
- Public announcements (with site-wide pinned banner)
- About + Contact pages
- **Start a project** — 3-step form with embedded **AI scoping assistant** that recommends a service + USD price range with live GHS conversion
- **Book a call** — date/slot picker with confirmation email
- Floating chat widget — anonymous → identified → live messaging
- Newsletter signup in footer
- Behavioural funnel tracking on every page + CTA

### Admin dashboard (`/admin`)
- Overview with KPIs (briefs, paid revenue, outstanding, page views)
- **Briefs** — list, filter by status, detail page with reply-via-email and SMS modals, internal notes, status workflow
- **Invoices** — full CRUD, USD-default with GHS toggle, line-item editor, auto-totals, **live currency-equivalent under the total**, email invoice to client with branded HTML
- **Clients** — derived view across briefs/invoices/bookings with paid + outstanding totals
- **Funnel** — conversion funnel viz, daily traffic chart, top pages, event breakdown
- **Chat** — admin console with live session list, conversation pane (admin replies also email the client)
- **Bookings** — upcoming/past with proper email/SMS modals
- **Broadcast** — send branded email or SMS to subscribers, brief submitters, bookers, invoiced clients, or everyone
- **Announcements** — create, pin to top bar, publish
- **Research** — create articles with category, body, tags

### Notifications
- **Email** (`lib/notify.ts → sendEmail`)
  - Auto-sent on every brief, booking, contact form (to client + admin)
  - Branded HTML wrapper with the actual logo, deep-purple header, gold rule, footer
  - Admin can compose ad-hoc emails to any client
  - Invoice send button generates a full itemised HTML email
- **SMS** (`lib/notify.ts → sendSms`)
  - Termii (default for Ghana/West Africa) or Twilio fallback
  - Phone number normalisation (assumes +233 if Ghana-style)
  - Admin can SMS any contact from the dashboard

### Currency
- `lib/currency.ts` fetches USD/GHS rate from open.er-api.com (primary) or fawazahmed0/currency-api (fallback), cached for 1 hour server-side
- `app/api/rate/route.ts` exposes it for client components, with `revalidate: 3600`
- `<Price usd={1200} />` component shows `$1,200.00` with `≈ GHS X at today's rate` underneath

---

## Required env vars

| Var | Purpose |
|-----|---------|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` (or `NEXTAUTH_SECRET`) | Auth.js v5 secret |
| `NEXTAUTH_URL` | Base URL for auth callbacks |
| `NEXT_PUBLIC_SITE_URL` | Base URL for emails (logo links etc.) |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Nodemailer |
| `ADMIN_EMAIL` | Where new-brief notifications land (default `ephraim@aetechdigitalhub.com`) |
| `TERMII_API_KEY` (or `TWILIO_*`) | SMS provider |

If SMTP/SMS aren't configured, sends are mocked to console.

---

## Deploying

Standard Next 16 app — deploys to Vercel, Render, or any Node host.

For Vercel:
1. Connect the repo
2. Set all env vars from `.env.example`
3. Ensure `NEXTAUTH_URL` and `NEXT_PUBLIC_SITE_URL` match your production domain
4. Deploy
