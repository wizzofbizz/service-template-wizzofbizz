# Service Booking Template

A complete booking and job-management website for a service business —
appointments, quoting, a small CRM, invoicing, payments and automated
customer follow-ups.

Built to be deployed per client: branding and behaviour come from
configuration, so setting up a new business means editing `.env` and the
admin settings, not the code.

---

## What it does

**For the customer**
- Browse services and book online
- Or describe a job, get a quote, accept it, then book
- Pay an invoice or booking deposit by card or EFT
- Automatic confirmations and reminders

**For the business owner**
- Dashboard of today's bookings, quotes and money owed
- Client records with full history
- Quotes with AI-assisted pricing, checked against their own rules
- Invoices, payments and overdue tracking
- An editable public website
- Automated chasing: quote follow-ups, appointment reminders, overdue notices

---

## Three ways to take bookings

Chosen by the owner in **Settings → Booking**, effective immediately.

| Mode | Flow | Suits |
|---|---|---|
| **Book straight away** | Pick a service → pick a slot → confirmed | Salons, tutors, physios, consultants |
| **Quote first, then book** | Describe the job → quote → accept → book | Plumbers, electricians, builders |
| **Quotes only** | Request a quote, timing arranged separately | Anyone scheduling manually |

---

## Running it locally

Requires Node 20+ and PostgreSQL 14+.

```bash
cp .env.example .env     # set DATABASE_URL, SESSION_SECRET, SEED_ADMIN_PASSWORD
npm install
npm run db:push          # create the tables
npm run db:seed          # demo business, services, landing page
npm run dev
```

Open <http://localhost:5000>. Sign in at `/login` with `demo@example.com` and
the `SEED_ADMIN_PASSWORD` you set.

### With Docker instead

```bash
cp .env.example .env     # set SESSION_SECRET at minimum
docker compose up --build
docker compose exec app npm run db:push
docker compose exec app npm run db:seed
```

---

## Everything optional is genuinely optional

The app boots and takes bookings with **no** integrations configured. Each one
degrades rather than failing:

| Integration | Without it |
|---|---|
| Email (SendGrid) | Notifications queue but do not send |
| AI quoting (Gemini) | Quotes use each service's configured pricing rules, flagged for review |
| Payments (PayFast) | No pay button; invoices are records to settle by EFT |
| Google Calendar | Availability comes from the built-in calendar only |
| Google sign-in | Button hidden; email/password login works |
| WhatsApp | Messages skipped; email still sends |
| Google Maps | No address autocomplete or distance-based travel fees |

---

## Rebranding for a client

1. **Names and contact details** — `VITE_*` in `.env` (compiled in, so rebuild
   after changing)
2. **Brand colour** — `--brand` in `client/src/index.css`, both the `:root` and
   dark-mode blocks. One edit rethemes everything.
3. **Business details, hours, prices, services** — the admin UI, no deploy
   needed

The split is deliberate: things the *developer* sets live in config, things
the *owner* changes live in the database, so they are self-service.

---

## Project layout

```
client/          React + Vite frontend
  src/config/    site.ts — central branding config
  src/pages/     public site, booking flows, admin dashboard
server/          Express API
  routes.ts      HTTP endpoints
  storage.ts     database access
  scheduler.ts   automated follow-ups
  *-service.ts   availability, AI quoting, calendar, payments
shared/
  schema.ts      Drizzle schema — the single source of truth for data shapes
```

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm run check` | TypeScript check |
| `npm run db:push` | Apply the schema to the database |
| `npm run db:seed` | Insert demo data (refuses to run in production) |

---

## Deploying

See **[DEPLOY.md](DEPLOY.md)** for the full per-client runbook: database,
domain and SSL, each integration's setup, backups and a tested restore.

For the business owner, **[docs/OWNER-GUIDE.md](docs/OWNER-GUIDE.md)** is a
plain-language manual with no technical knowledge assumed.

---

## Tech

Node + Express, React + Vite, PostgreSQL via Drizzle ORM, TypeScript
throughout. Standard `pg` driver, so it runs on any Postgres — Docker,
Coolify, managed, or serverless.
