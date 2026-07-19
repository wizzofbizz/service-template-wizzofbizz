# Deployment Guide

Per-client deployment runbook. Target is Coolify on Hetzner, but nothing here
is Coolify-specific — any host that can run a Docker container and a
PostgreSQL database will do.

Work through it in order. Sections 1–5 get a client live; 6–9 are the
integrations, each optional and each safe to skip.

---

## 1. Before you start

You need:

- A server (Hetzner CX22 or larger is comfortable) running Coolify
- A domain or subdomain pointed at that server
- PostgreSQL 14+ — a Coolify database resource, a managed instance, or the
  bundled container from `docker-compose.yml`

You do **not** need any API keys to get a working site. Every integration is
optional; the app boots and takes bookings with none configured.

---

## 2. Create the database

In Coolify: **New Resource → Database → PostgreSQL 16**.

Copy the connection string it gives you. It looks like:

```
postgresql://postgres:PASSWORD@HOST:5432/postgres
```

Keep it — it becomes `DATABASE_URL`.

---

## 3. Create the application

**New Resource → Application → Public/Private Repository**, pointed at this
repo. Coolify detects the `Dockerfile` automatically.

Set the port to **5000**.

---

## 4. Configure the environment

Copy every variable from `.env.example` into Coolify's Environment Variables
panel and fill in the required block.

**Required:**

| Variable | Notes |
|---|---|
| `DATABASE_URL` | From step 2 |
| `SESSION_SECRET` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `PUBLIC_BASE_URL` | `https://theirdomain.co.za` — no trailing slash |
| `NODE_ENV` | `production` |
| `SEED_ADMIN_PASSWORD` | 12+ characters. Used once, then changed at first login |
| `ENCRYPTION_MASTER_KEY` | Required if using WhatsApp. Generate as above |

> **`PUBLIC_BASE_URL` matters more than it looks.** Every customer-facing link
> — quotes, invoices, booking confirmations, payment return URLs — is built
> from it. Wrong value means customers land on the wrong host.

> **`ENCRYPTION_MASTER_KEY` must never change** once set. It decrypts stored
> WhatsApp tokens; change it and they become permanently unreadable.

**Branding** — the `VITE_*` variables are compiled into the frontend at build
time, so **changing any of them requires a rebuild**, not just a restart.

The brand colour is deliberately not an environment variable: edit `--brand`
in `client/src/index.css` (both the `:root` and dark-mode blocks). One edit
rethemes the entire app.

---

## 5. First deploy

Deploy. Then, once, from Coolify's terminal for the app container:

```bash
npm run db:push     # creates the tables
npm run db:seed     # demo business, services and landing page — optional
```

`db:push` is deliberately manual. It is not run automatically at startup,
because a schema change firing during a container restart is a bad way to
find out about a migration problem.

**Sign in** at `https://theirdomain.co.za/login` using `demo@example.com` and
the `SEED_ADMIN_PASSWORD` you set.

**Immediately:**

1. Change the password (Settings → Account)
2. Update the business details (Settings → Business)
3. Replace the demo services with the client's real ones (Services)
4. Set working hours and booking rules (Settings → Calendar)
5. Choose the booking mode (Settings → Booking) — see below

### Booking modes

Set in **Settings → Booking**, and it takes effect immediately — no redeploy.

| Mode | Customer experience | Suits |
|---|---|---|
| **Book straight away** | Pick a service, pick a slot, confirmed | Salons, tutors, physios, consultants |
| **Quote first, then book** | Describe the job → quote → accept → book | Plumbers, electricians, builders |
| **Quotes only** | Request a quote; timing arranged off-site | Anyone who schedules manually |

Instant booking shows each service's price and duration, so make sure both are
set correctly on every active service first.

---

## 6. Email (optional, strongly recommended)

Without email, notifications queue in the database but never send — no booking
confirmations, no reminders.

1. Create a SendGrid account and an API key with **Mail Send** permission
2. Verify the sender address (Single Sender or domain authentication)
3. Set `SENDGRID_API_KEY` and `SENDGRID_FROM_EMAIL`

Test by making a booking and checking Settings → the email queue drains.

---

## 7. Payments — PayFast (optional)

Two independent switches, deliberately:

- **You** set the merchant credentials in the environment
- **The owner** turns payments on in Settings → Payments

Payments only go live when both are done. Credentials never touch the database
or the admin UI.

**Sandbox first:**

```
PAYFAST_MODE=sandbox
PAYFAST_SANDBOX_MERCHANT_ID=10000100
PAYFAST_SANDBOX_MERCHANT_KEY=46f0cd694581a
```

Those are PayFast's own public test credentials — safe to commit, safe to
share.

**Going live:** set `PAYFAST_MODE=live` plus `PAYFAST_PROD_MERCHANT_ID`,
`PAYFAST_PROD_MERCHANT_KEY` and `PAYFAST_PROD_PASSPHRASE` from the client's
PayFast dashboard.

In PayFast's dashboard, set the ITN (notify) URL to:

```
https://theirdomain.co.za/api/payments/webhook/payfast
```

The webhook verifies signature, source IP and amount before marking anything
paid, and ignores duplicate notifications.

---

## 8. AI quoting (optional)

Get a key at <https://aistudio.google.com/apikey> and set `GEMINI_API_KEY`.

Without it, quoting still works: prices come from each service's own
configured rules, and quotes are flagged low-confidence so the owner reviews
them before sending. A client can start without AI and add it later.

---

## 9. Google Calendar sync (optional)

Reads the owner's busy times so booked-out slots are never offered, and writes
confirmed bookings into their calendar.

1. <https://console.cloud.google.com> → create a project
2. **APIs & Services → Library** → enable **Google Calendar API**
3. **APIs & Services → Credentials → Create Credentials → Service Account**
4. Open the service account → **Keys → Add Key → JSON**. Download it.
5. Copy the service account's email (`something@project.iam.gserviceaccount.com`)
6. In the client's Google Calendar → **Settings → Share with specific people**
   → add that email with **"Make changes to events"**
7. Copy the **Calendar ID** from Settings → Integrate calendar
8. Set:
   ```
   ENABLE_GOOGLE_CALENDAR=true
   GOOGLE_CALENDAR_ID=<calendar id>
   GOOGLE_SERVICE_ACCOUNT_JSON=<the whole JSON file, on one line>
   ```

Verify: sign in and open Settings — the calendar status will confirm the
connection or explain what is wrong.

Step 6 is the one people miss. Without sharing the calendar, the API returns
404 or 403 even with valid credentials.

---

## 10. Other optional integrations

| Integration | Variables | Without it |
|---|---|---|
| Google sign-in | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Button hidden; email/password login works |
| Google Maps | `GOOGLE_MAPS_API_KEY` | No address autocomplete or travel-fee distance |
| WhatsApp (WaSender) | `WASENDER_PERSONAL_ACCESS_TOKEN` | WhatsApp messages skipped, email still sends |
| WhatsApp (Twilio) | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER` | as above |

For Google sign-in, the authorised redirect URI is
`https://theirdomain.co.za/api/callback`.

---

## 11. Domain and SSL

In Coolify, set the application's domain to `theirdomain.co.za`. Coolify
issues and renews a Let's Encrypt certificate automatically.

Point DNS at the server:

```
A    @      <server ip>
A    www    <server ip>
```

Make sure `PUBLIC_BASE_URL` matches the final `https://` address exactly.

---

## 12. Scheduled reminders

The scheduler runs inside the app — no external cron needed. It sends quote
follow-ups, appointment and deposit reminders, and overdue-invoice notices,
and flushes the email queue every five minutes.

Defaults: reminders at 09:00 in `SCHEDULER_TIMEZONE`
(`Africa/Johannesburg`). Adjust with `SCHEDULER_REMINDERS_CRON`.

**If you run more than one instance**, set `ENABLE_SCHEDULER=false` on all but
one. Duplicate sends are prevented at the database level regardless, but
there is no reason to have several instances competing.

---

## 13. Backups

Set up before handing over, not after.

**In Coolify:** open the PostgreSQL resource → **Backups** → enable scheduled
backups (daily is fine for most service businesses) with an S3-compatible
destination.

**Also back up uploaded images** — they live in the `uploads` volume, not the
database.

### Test the restore

A backup you have not restored is not a backup.

```bash
# Restore into a scratch database
createdb -h HOST -U postgres restore_test
psql -h HOST -U postgres -d restore_test < backup.sql

# Confirm the data is really there
psql -h HOST -U postgres -d restore_test -c \
  "SELECT (SELECT count(*) FROM contacts) AS contacts,
          (SELECT count(*) FROM jobs) AS jobs,
          (SELECT count(*) FROM invoices) AS invoices;"

dropdb -h HOST -U postgres restore_test
```

Do this once per client at handover.

---

## 14. Updating a deployed client

```bash
git pull
# Coolify redeploys automatically on push if configured
```

If the update includes schema changes, run `npm run db:push` afterwards from
the container terminal. Check the release notes before deploying.

---

## Troubleshooting

**App will not start**
Check the logs. The most common cause is `DATABASE_URL` being unreachable —
the app fails fast rather than serving in a broken state.

**"PUBLIC_BASE_URL must be set in production"**
Exactly what it says. The app refuses to start rather than send customers
links to `localhost`.

**Customers get links to the wrong domain**
`PUBLIC_BASE_URL` does not match the real domain. Fix and restart.

**Emails are not arriving**
Check Settings for queued emails. If they are queued but not sending,
`SENDGRID_API_KEY` is missing or the sender address is unverified.

**Payments do not appear after a customer pays**
The ITN URL in PayFast's dashboard is wrong or unreachable. It must be
`https://theirdomain.co.za/api/payments/webhook/payfast` and publicly
reachable — the webhook, not the browser redirect, is what records a payment.

**Calendar shows no availability**
Check working hours in Settings → Calendar. A brand-new business has none set,
so nothing is bookable.

**Branding changes are not showing**
`VITE_*` variables are compiled in. Rebuild, do not just restart.
