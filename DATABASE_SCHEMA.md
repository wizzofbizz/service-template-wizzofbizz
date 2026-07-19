# Smart Website SaaS - Database Schema Documentation

**Version:** 2.0 (Complete)  
**Date:** October 24, 2025  
**Database:** PostgreSQL (Neon-backed on Replit)  
**Multi-Tenancy:** Single database with tenant isolation via `business_id`  
**Total Tables:** 17 (10 MVP + 7 Phase 2)

---

## Overview

This database schema supports a multi-tenant SaaS platform for small service-based businesses in South Africa. The complete schema includes MVP tables for core functionality plus Phase 2 tables for advanced features (email automation, file attachments, audit logging, payment processing, geographic services, and scheduling).

### Key Design Principles

1. **Multi-Tenant Isolation**: All tables include `business_id` foreign key (except root `businesses` table)
2. **Soft Relationships**: Foreign keys use `ON DELETE CASCADE` for automatic cleanup
3. **Portable Schema**: Standard PostgreSQL - no vendor-specific features
4. **Production-Ready**: All Phase 2 features designed and implemented
5. **Auto-Generated IDs**: All primary keys use `uuid` with `defaultRandom()`

---

## Entity Relationship Diagram

```
CORE ENTITIES (MVP):
businesses (1) ──→ (N) users
           (1) ──→ (N) contacts
           (1) ──→ (N) services
           (1) ──→ (N) quotes
           (1) ──→ (N) jobs
           (1) ──→ (N) testimonials
           (1) ──→ (N) invoices
           (1) ──→ (1) calendar_settings

PHASE 2 EXTENSIONS:
businesses (1) ──→ (N) attachments
           (1) ──→ (N) email_queue
           (1) ──→ (N) email_templates
           (1) ──→ (N) activity_log
           (1) ──→ (N) payment_transactions (via invoices)
           (1) ──→ (N) service_areas
           (1) ──→ (N) business_hours

RELATIONSHIPS:
contacts (1) ──→ (N) quotes
         (1) ──→ (N) jobs
         (1) ──→ (N) invoices

quotes (1) ──→ (N) quote_items
       (1) ──→ (0..1) jobs

jobs (1) ──→ (0..1) invoices

invoices (1) ──→ (N) payment_transactions

users (1) ──→ (N) jobs [assigned_to]
      (1) ──→ (N) quotes [created_by]
      (1) ──→ (N) attachments [uploaded_by]

POLYMORPHIC:
attachments → [quotes, jobs, invoices, testimonials]
email_queue → [quotes, jobs, invoices]
activity_log → [all entities]
```

---

## Table Definitions (All 17 Tables)

### MVP TABLES (1-10)

### 1. `businesses` (Tenants)
The central tenant table - each row represents one small business client.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_name | varchar(255) | NOT NULL | Display name |
| slug | varchar(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| industry | varchar(100) | nullable | Business type |
| owner_name | varchar(255) | nullable | Owner's full name |
| email | varchar(255) | NOT NULL | Primary contact email |
| phone | varchar(50) | nullable | Contact phone |
| address_line1 | text | nullable | Street address |
| address_line2 | text | nullable | Apt/Suite |
| city | varchar(100) | nullable | City |
| province | varchar(100) | nullable | Province/State |
| postal_code | varchar(20) | nullable | Postal/ZIP |
| business_description | text | nullable | About the business |
| logo_url | text | nullable | Object storage path |
| primary_color | varchar(7) | DEFAULT '#217BF4' | Brand hex color |
| website_status | enum | DEFAULT 'draft' | draft, published, suspended |
| subscription_status | enum | DEFAULT 'trial' | trial, active, suspended, cancelled |
| subscription_tier | enum | DEFAULT 'basic' | basic, standard, premium |
| created_at | timestamp | DEFAULT NOW() | Record creation |
| updated_at | timestamp | DEFAULT NOW() | Last modification |

---

### 2. `users` (Authentication & Team Members)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| email | varchar(255) | UNIQUE, NOT NULL | Login email |
| password_hash | text | NOT NULL | Bcrypt hashed |
| full_name | varchar(255) | nullable | Display name |
| role | enum | DEFAULT 'owner' | owner, admin, technician |
| avatar_url | text | nullable | Profile picture |
| is_active | boolean | DEFAULT true | Account status |
| last_login_at | timestamp | nullable | Last auth |
| created_at | timestamp | DEFAULT NOW() | Account creation |
| updated_at | timestamp | DEFAULT NOW() | Last update |

---

### 3. `contacts` (Unified Customers/Leads)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| full_name | varchar(255) | NOT NULL | Contact name |
| email | varchar(255) | nullable | Email address |
| phone | varchar(50) | nullable | Phone number |
| address | text | nullable | Physical address |
| contact_type | enum | DEFAULT 'lead' | lead, customer, past_customer |
| lead_source | enum | DEFAULT 'website' | website, referral, google, direct, other |
| lead_status | enum | DEFAULT 'new' | new, contacted, quoted, converted, lost |
| notes | text | nullable | Internal notes |
| created_at | timestamp | DEFAULT NOW() | First contact |
| updated_at | timestamp | DEFAULT NOW() | Last update |

---

### 4. `services` (Service Catalog)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| service_name | varchar(255) | NOT NULL | Service title |
| description | text | nullable | Service details |
| category | varchar(100) | nullable | Grouping |
| pricing_type | enum | DEFAULT 'fixed' | fixed, hourly, per_item, custom |
| base_price | decimal(10,2) | nullable | Standard price |
| duration_minutes | integer | nullable | Est. duration |
| is_active | boolean | DEFAULT true | Visibility |
| display_order | integer | DEFAULT 0 | Sort order |
| created_at | timestamp | DEFAULT NOW() | Creation |
| updated_at | timestamp | DEFAULT NOW() | Update |

---

### 5. `quotes` (Estimates)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| contact_id | uuid | FK → contacts.id | Customer reference |
| quote_number | varchar(50) | UNIQUE, NOT NULL | Auto: 'Q-2025-0001' |
| status | enum | DEFAULT 'draft' | draft, sent, viewed, accepted, declined, expired |
| valid_until | date | nullable | Expiration date |
| subtotal | decimal(10,2) | NOT NULL | Pre-tax total |
| tax_amount | decimal(10,2) | DEFAULT 0 | Sales tax |
| discount_amount | decimal(10,2) | DEFAULT 0 | Discount |
| total_amount | decimal(10,2) | NOT NULL | Final amount |
| notes | text | nullable | Terms & conditions |
| sent_at | timestamp | nullable | Email sent |
| viewed_at | timestamp | nullable | Customer viewed |
| accepted_at | timestamp | nullable | Customer accepted |
| created_by | uuid | FK → users.id | Creator |
| created_at | timestamp | DEFAULT NOW() | Creation |
| updated_at | timestamp | DEFAULT NOW() | Update |

---

### 6. `quote_items` (Line Items)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| quote_id | uuid | FK → quotes.id | Parent quote |
| service_id | uuid | FK → services.id | Service ref (optional) |
| description | text | NOT NULL | Line item desc |
| quantity | decimal(10,2) | DEFAULT 1 | Quantity |
| unit_price | decimal(10,2) | NOT NULL | Price per unit |
| line_total | decimal(10,2) | NOT NULL | quantity × unit_price |
| display_order | integer | DEFAULT 0 | Sort order |

---

### 7. `jobs` (Scheduled Work/Bookings)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| contact_id | uuid | FK → contacts.id | Customer |
| quote_id | uuid | FK → quotes.id | Originating quote |
| assigned_to | uuid | FK → users.id | Technician |
| job_number | varchar(50) | UNIQUE, NOT NULL | Auto: 'J-2025-0001' |
| title | varchar(255) | NOT NULL | Job name |
| description | text | nullable | Work details |
| status | enum | DEFAULT 'scheduled' | scheduled, in_progress, completed, cancelled |
| scheduled_date | date | NOT NULL | Appointment date |
| scheduled_start_time | time | nullable | Start time |
| scheduled_end_time | time | nullable | End time |
| actual_start_time | timestamp | nullable | Work began |
| actual_end_time | timestamp | nullable | Work finished |
| location_address | text | nullable | Job site |
| internal_notes | text | nullable | Private notes |
| created_at | timestamp | DEFAULT NOW() | Booking creation |
| updated_at | timestamp | DEFAULT NOW() | Update |

---

### 8. `testimonials` (Reviews)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| contact_id | uuid | FK → contacts.id | Customer ref |
| author_name | varchar(255) | NOT NULL | Reviewer name |
| author_title | varchar(100) | nullable | e.g., "Homeowner" |
| rating | integer | NOT NULL, 1-5 | Star rating |
| testimonial_text | text | NOT NULL | Review content |
| avatar_url | text | nullable | Reviewer photo |
| status | enum | DEFAULT 'pending' | pending, approved, rejected |
| is_featured | boolean | DEFAULT false | Homepage highlight |
| display_order | integer | DEFAULT 0 | Sort order |
| created_at | timestamp | DEFAULT NOW() | Submission |
| approved_at | timestamp | nullable | Approval |

---

### 9. `calendar_settings` (Availability Config)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id, UNIQUE | One per business |
| google_calendar_id | text | nullable | Google Calendar ID |
| working_days | jsonb | nullable | `{monday: {start, end}}` |
| booking_buffer_minutes | integer | DEFAULT 30 | Gap between appts |
| max_bookings_per_day | integer | DEFAULT 8 | Daily capacity |
| created_at | timestamp | DEFAULT NOW() | Creation |
| updated_at | timestamp | DEFAULT NOW() | Update |

---

### 10. `invoices` (Payment Tracking)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| job_id | uuid | FK → jobs.id | Related job |
| contact_id | uuid | FK → contacts.id | Customer |
| invoice_number | varchar(50) | UNIQUE, NOT NULL | Auto: 'INV-2025-0001' |
| status | enum | DEFAULT 'draft' | draft, sent, paid, overdue, cancelled |
| due_date | date | nullable | Payment deadline |
| paid_at | timestamp | nullable | Payment received |
| payment_method | enum | nullable | cash, card, bank_transfer, other |
| subtotal | decimal(10,2) | NOT NULL | Pre-tax total |
| tax_amount | decimal(10,2) | DEFAULT 0 | Sales tax |
| total_amount | decimal(10,2) | NOT NULL | Final amount |
| notes | text | nullable | Payment terms |
| created_at | timestamp | DEFAULT NOW() | Creation |
| updated_at | timestamp | DEFAULT NOW() | Update |

---

### PHASE 2 TABLES (11-17)

### 11. `attachments` (File Uploads - Polymorphic)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| related_type | enum | NOT NULL | quote, job, invoice, testimonial, other |
| related_id | uuid | NOT NULL | Parent entity ID |
| file_name | varchar(255) | NOT NULL | Original filename |
| file_url | text | NOT NULL | Object storage URL |
| file_size | integer | nullable | Size in bytes |
| mime_type | varchar(100) | nullable | Content type |
| uploaded_by | uuid | FK → users.id | Uploader |
| created_at | timestamp | DEFAULT NOW() | Upload time |

**Use Cases:**
- Quote PDFs, images, specifications
- Job site photos, before/after
- Invoice supporting documents
- Testimonial images

---

### 12. `email_queue` (Outbound Email Tracking)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| to_email | varchar(255) | NOT NULL | Recipient email |
| to_name | varchar(255) | nullable | Recipient name |
| subject | varchar(500) | NOT NULL | Email subject |
| body_html | text | nullable | HTML version |
| body_text | text | nullable | Plain text |
| status | enum | DEFAULT 'pending' | pending, sent, failed, cancelled |
| template_id | uuid | nullable | Template used |
| related_type | enum | nullable | quote, job, invoice |
| related_id | uuid | nullable | Parent entity |
| scheduled_for | timestamp | nullable | Delayed send |
| sent_at | timestamp | nullable | Sent time |
| error_message | text | nullable | Failure reason |
| retry_count | integer | DEFAULT 0 | Retry attempts |
| created_at | timestamp | DEFAULT NOW() | Queue time |

**Use Cases:**
- Quote emails, reminders
- Job confirmations, follow-ups
- Invoice delivery
- Review requests

---

### 13. `email_templates` (Reusable Templates)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| name | varchar(255) | NOT NULL | Template name |
| subject | varchar(500) | NOT NULL | Email subject |
| body_html | text | NOT NULL | HTML body |
| body_text | text | nullable | Plain text |
| template_type | enum | NOT NULL | quote_sent, job_reminder, invoice_sent, review_request, welcome, custom |
| variables | jsonb | nullable | `{customerName, jobDate}` |
| is_active | boolean | DEFAULT true | Enabled |
| created_at | timestamp | DEFAULT NOW() | Creation |
| updated_at | timestamp | DEFAULT NOW() | Update |

**Variables Example:**
```json
{
  "customerName": "John Smith",
  "jobDate": "2025-11-01",
  "totalAmount": "R850.00"
}
```

---

### 14. `activity_log` (Audit Trail)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| user_id | uuid | FK → users.id | Who acted |
| action | enum | NOT NULL | create, update, delete, view, send, login, logout |
| entity_type | enum | NOT NULL | business, user, contact, service, quote, job, invoice, testimonial |
| entity_id | uuid | nullable | Entity affected |
| changes | jsonb | nullable | Before/after values |
| ip_address | varchar(45) | nullable | IPv4/IPv6 |
| user_agent | text | nullable | Browser info |
| created_at | timestamp | DEFAULT NOW() | Action time |

**Use Cases:**
- POPIA compliance (data access tracking)
- Security auditing
- Debugging user issues
- Business intelligence

**Changes Example:**
```json
{
  "before": {"status": "draft"},
  "after": {"status": "sent"}
}
```

---

### 15. `payment_transactions` (Detailed Payment Records)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| invoice_id | uuid | FK → invoices.id | Related invoice |
| transaction_id | varchar(255) | nullable | Gateway transaction ID |
| amount | decimal(10,2) | NOT NULL | Payment amount |
| currency | varchar(3) | DEFAULT 'ZAR' | Currency code |
| payment_method | enum | NOT NULL | cash, card, bank_transfer, other |
| status | enum | DEFAULT 'pending' | pending, completed, failed, refunded |
| gateway | enum | NOT NULL | stripe, payfast, manual, other |
| gateway_response | jsonb | nullable | Full gateway response |
| metadata | jsonb | nullable | Additional data |
| processed_at | timestamp | nullable | Processing time |
| created_at | timestamp | DEFAULT NOW() | Creation |

**Use Cases:**
- Payment reconciliation
- Refund tracking
- Gateway integration
- Financial reporting

---

### 16. `service_areas` (Geographic Coverage)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| area_name | varchar(255) | NOT NULL | Display name |
| postal_codes | text[] | nullable | Array of postal codes |
| cities | text[] | nullable | Array of cities |
| provinces | text[] | nullable | Array of provinces |
| is_active | boolean | DEFAULT true | Currently serving |
| travel_fee | decimal(10,2) | DEFAULT 0 | Additional charge |
| created_at | timestamp | DEFAULT NOW() | Creation |
| updated_at | timestamp | DEFAULT NOW() | Update |

**Use Cases:**
- Service availability checking
- Travel fee calculation
- Lead qualification
- SEO targeting

**Example:**
```json
{
  "area_name": "Northern Suburbs - Cape Town",
  "postal_codes": ["7441", "7460", "7485"],
  "cities": ["Milnerton", "Table View", "Bloubergstrand"],
  "provinces": ["Western Cape"],
  "travel_fee": "50.00"
}
```

---

### 17. `business_hours` (Weekly Schedule)

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | uuid | PRIMARY KEY | Auto-generated UUID |
| business_id | uuid | FK → businesses.id | Tenant association |
| day_of_week | enum | NOT NULL | monday, tuesday, ..., sunday |
| start_time | time | nullable | Opening time |
| end_time | time | nullable | Closing time |
| is_closed | boolean | DEFAULT false | Closed this day |
| created_at | timestamp | DEFAULT NOW() | Creation |
| updated_at | timestamp | DEFAULT NOW() | Update |

**Use Cases:**
- Booking availability
- Website display
- Auto-scheduling
- Public holiday handling

**Example Setup:**
```sql
-- Monday-Friday: 8am-5pm
INSERT INTO business_hours (business_id, day_of_week, start_time, end_time)
VALUES 
  (:id, 'monday', '08:00', '17:00'),
  (:id, 'tuesday', '08:00', '17:00'),
  (:id, 'wednesday', '08:00', '17:00'),
  (:id, 'thursday', '08:00', '17:00'),
  (:id, 'friday', '08:00', '17:00');

-- Saturday: Half day
INSERT INTO business_hours (business_id, day_of_week, start_time, end_time)
VALUES (:id, 'saturday', '08:00', '12:00');

-- Sunday: Closed
INSERT INTO business_hours (business_id, day_of_week, is_closed)
VALUES (:id, 'sunday', true);
```

---

## Multi-Tenancy Implementation

### Row-Level Isolation

All queries **MUST** filter by `business_id`:

```typescript
// ✅ CORRECT - Tenant isolated
const quotes = await storage.getQuotesByBusinessId(req.user.businessId);

// ❌ WRONG - Could leak data across tenants
const quotes = await storage.getAllQuotes();
```

### Middleware Pattern

```typescript
// Authentication middleware sets businessId
export const requireAuth = (req, res, next) => {
  req.user = {
    id: session.userId,
    businessId: session.businessId, // ← Critical!
    role: session.role
  };
  next();
};

// All routes enforce tenant isolation
app.get('/api/quotes', requireAuth, async (req, res) => {
  const quotes = await storage.getQuotesByBusinessId(req.user.businessId);
  res.json(quotes);
});
```

---

## Data Portability

### Export Database

```bash
# Full backup (all tenants)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Single tenant export
pg_dump $DATABASE_URL \
  --table businesses \
  --table users \
  --table contacts \
  --where "business_id='abc-123'" > tenant_export.sql

# Schema only
pg_dump --schema-only $DATABASE_URL > schema.sql
```

### Restore to New System

```bash
# Any PostgreSQL 14+ database
psql <new-database-url> < backup.sql
```

**Zero vendor lock-in** - Standard PostgreSQL DDL/DML.

---

## Performance Optimization

### Recommended Indexes

Already implemented via Drizzle:
- All `business_id` columns (tenant isolation)
- Status enums (`quote_status`, `job_status`, `lead_status`, `email_status`, `transaction_status`)
- Date fields (`scheduled_date`, `created_at`, `due_date`)
- Unique constraints (`email`, `slug`, `quote_number`, `job_number`, `invoice_number`)

### Additional Indexes (Add as needed)

```sql
-- For activity log queries
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id, business_id);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- For email queue processing
CREATE INDEX idx_email_queue_status_scheduled ON email_queue(status, scheduled_for);

-- For payment reconciliation
CREATE INDEX idx_payment_transactions_invoice ON payment_transactions(invoice_id, status);

-- For geographic queries
CREATE INDEX idx_service_areas_active ON service_areas(business_id, is_active);
```

### Query Optimization Tips

1. **Always filter by `business_id` first** (uses index)
2. **Use pagination** for large result sets (`LIMIT`/`OFFSET`)
3. **Avoid N+1 queries** - use joins or batch fetching
4. **Cache frequently accessed data** (business settings, email templates)
5. **Use `EXPLAIN ANALYZE`** to diagnose slow queries

---

## Security Best Practices

1. **Tenant Isolation**: Never trust client-provided `business_id` - always use authenticated session
2. **Password Storage**: Bcrypt with salt rounds ≥ 10
3. **SQL Injection**: Drizzle ORM provides parameterized queries
4. **POPIA Compliance**: Activity log tracks all data access
5. **Backup Strategy**: Daily automated backups (Replit handles this)
6. **File Security**: Validate file types, scan for malware, use signed URLs for attachments
7. **Rate Limiting**: Limit email sends per business (prevent spam)

---

## Future Enhancements

Potential additions (Phase 3+):

- `notifications` - In-app notifications
- `webhook_logs` - Integration tracking (Zapier, Make)
- `subscription_plans` - Custom pricing tiers
- `business_holidays` - Calendar blocking
- `custom_fields` - User-defined contact/job fields
- `analytics_events` - Website visitor tracking
- `sms_queue` - WhatsApp/SMS automation

---

## Version History

| Version | Date | Tables | Changes |
|---------|------|--------|---------|
| 1.0 | Oct 24, 2025 | 10 | Initial MVP schema |
| 2.0 | Oct 24, 2025 | 17 | Added 7 Phase 2 tables (attachments, email_queue, email_templates, activity_log, payment_transactions, service_areas, business_hours) |

---

## Quick Reference

**Total Tables:** 17  
**Total Enums:** 16  
**Foreign Keys:** 28  
**Multi-Tenant Tables:** 16 (all except `businesses`)  
**Polymorphic Tables:** 3 (`attachments`, `email_queue`, `activity_log`)

**Database Size Estimate (per 100 businesses):**
- Minimal usage: ~50 MB
- Active usage: ~500 MB - 1 GB
- Heavy usage: ~2-5 GB

**Query Performance Targets:**
- Simple queries: < 10ms
- Complex joins: < 50ms
- Reports/analytics: < 500ms

---

## Contact & Support

- **Database Tool**: Use Replit's Database pane (Drizzle Studio)
- **Migrations**: `npm run db:push` (Drizzle Kit)
- **Production Access**: Via Replit deployment settings
- **Schema Changes**: Update `shared/schema.ts` → run `npm run db:push`
