# Database setup and D1 migration

The original D1 schema is preserved as reference only in `docs/source-reference/d1-schema.sql`. It is not executable MySQL SQL. Original customer records were not read/exported and their count and contents remain unknown.

## Fresh MySQL database

Import `deploy/schema.mysql.sql` into a separate new database using phpMyAdmin. It is the same initial migration as `deploy/migrations/001-venue-enquiries.sql`. It uses InnoDB, utf8mb4 and ordinary table/insert permissions, with no procedures or privileged operations. Record the actual host's `SELECT VERSION()` result before relying on compatibility.

Every enquiry column is preserved: `id`, `reference`, `name`, `organisation`, `email`, `phone`, `venue_type`, `city`, `message`, `contact_consent`, `created_at`. IDs use a case-sensitive ASCII primary key. References are not unique because the source's eight-character reference prefix can collide. `created_at` retains the original Unix epoch milliseconds as an unsigned BIGINT; it is not converted to a local-time SQL timestamp. The migration ledger's `applied_at` is only a setup timestamp.

Input limits match the source form. If old records exceed the new column limits, conversion stops for review rather than truncating them. The pool is lazy, limited to five connections and twenty queued requests, with timeouts and prepared queries. Public page rendering and builds never need database access.

## Retry and schema verification

Initial import is safe to repeat on the new matching schema: table creation uses `IF NOT EXISTS`, and the ledger records the version once without replacing its checksum. This does **not** upgrade an existing table. Before retrying an import after an error, inspect its current state:

```sql
SELECT VERSION();
SHOW CREATE TABLE venue_enquiries;
SHOW CREATE TABLE schema_migrations;
SELECT version, checksum, applied_at FROM schema_migrations;
SELECT COUNT(*) AS enquiry_count FROM venue_enquiries;
```

Compare the recorded `001-venue-enquiries` checksum with the literal in the delivered SQL, and compare all fields with that SQL. Stop if either differs. Do not overwrite an applied migration or assume the presence of the ledger proves the tables are correct. Use a new numbered migration for future schema changes. MySQL DDL can commit independently; this guide does not promise transactional rollback of table creation.

The app writes the enquiry in a transaction, reads its stored reference and returns success only after commit. Duplicate IDs preserve the original record. Retrying a lost response with the same ID does not insert another row. Missing credentials, unavailable MySQL or a missing table return HTTP 503 without a fake success message.

## Optional offline D1 record migration

Leave the original D1 database read-only. Use its owning account's supported read-only export/query method to obtain a JSON array of the explicitly listed enquiry fields. This guide does not assume a dashboard offers a particular download format. The converter accepts an array, or an object with a `results` array. Do not paste customer records into chat or add them to GitHub.

The equivalent read-only query is:

```sql
SELECT id, reference, name, organisation, email, phone, venue_type,
       city, message, contact_consent, created_at
FROM venue_enquiries ORDER BY id;
```

Record the original count and export time. Keep a private, unchanged source export as the restore point. Convert locally, not through a public server endpoint:

```sh
mkdir -p private-data
npm run db:convert-export -- /absolute/private/export.json private-data/staged-import.sql
```

The output includes sensitive customer data. `private-data/` is ignored by Git and must not be included in a delivery archive. The script never opens a database or makes a network request. It preserves raw strings, IDs, consent and millisecond timestamps, emits UTF-8 hex literals to preserve quotes/newlines independently of SQL escaping mode, validates field lengths, omits identical duplicate IDs and rejects conflicting duplicates. It refuses to overwrite an output file. Use a new output filename when retrying conversion.

The script prints counts and the input SHA-256, without customer details. It produces:

- `staged-import.sql`: inserts into the new database's separate `venue_enquiries_import` table only. Repeated staging skips existing IDs rather than overwriting them.
- `staged-import.sql.review.sql`: read-only counts and conflict checks; the final merge is commented out for review.

Import the staging file into the **new** database. Before merging, run the review SELECT statements, compare staged and expected unique counts, and verify the staged fields against the unchanged export. If a different export was already staged, do not reuse that staging table without reviewing it; skipped IDs are not updates. Stop if existing target records conflict. Never silently overwrite an enquiry.

When counts, fields and conflicts are reviewed, copy and run the commented merge block in phpMyAdmin. It inserts new IDs and retains existing IDs, making a repeat of the same reviewed merge safe. Verify the final expected count (existing IDs plus new IDs), original IDs/references, consent, Unicode, messages and timestamps. Preserve the original export and a new database export privately before any launch. Do not delete the original D1 data as part of this migration.

## Email and hosted verification

An SQL row proves storage, not email delivery. The source has no notification provider configured; its email links are unchanged. The actual Hostinger engine/version, privileges, TLS requirements, schema, data migration and enquiry delivery remain unverified until the new app/database are configured and tested there.
