# Jolly Nail Printing — Hostinger version 2

An independent hosting migration of `senju4477/jolly-nail-printing`, source branch `main`, commit `ca269047f6367ae4389f84077a303c4e55f6bbb7`. The original repository and live website were left unchanged.

The homepage, wording, cobalt/porcelain/cherry branding, navigation, gallery, machine tabs, dialogs, FAQs, location search, fonts, images and machine video are preserved. `app/page.tsx`, `app/globals.css`, `lib/locations.ts` and every public asset are byte-identical to the source. Launch locations remain unconfirmed.

## Runtime

Official Next.js 16.3.8, React 19.2.6, TypeScript, Tailwind CSS, Radix UI and MySQL through `mysql2`. Node.js 22.x and npm are required. Vinext, Vite, Workers, D1 runtime bindings, Wrangler and unused provider scaffolding were removed from this copy. The source's optional auth/connector helpers were not used by any page or endpoint; the website has no account or connector-dependent features.

Production builds use Webpack and Next's generated standalone server. `scripts/prepare-standalone.mjs` copies `public/` and `.next/static/` into the standalone artifact. `npm start` runs that artifact, honors `PORT`, defaults locally to 3000, and binds to `0.0.0.0`.

## Run locally

```sh
npm ci
npm run lint
npm run build
npm run typecheck
npm start
```

For development use `npm run dev`. Copy `.env.example` to `.env.local` and enter values privately when configuring a local database. Hostinger values belong in hPanel. The website and build work without MySQL credentials; a valid venue enquiry returns HTTP 503 until the separate database and schema are configured.

## Deploy

Follow [docs/HOSTINGER-DEPLOYMENT.md](docs/HOSTINGER-DEPLOYMENT.md). This project is in the **separate private GitHub repository** `senju4477/jolly-nail-printing-hostinger-v2`, branch `main`. Import it into a separate Hostinger Node.js app. Do not connect the original repository or reuse a live website slot. Framework: Next.js; Node: 22; build script: `build`; output: `.next`; entry file: blank.

Preview indexing is disabled by default through metadata, `X-Robots-Tag`, robots.txt and an empty sitemap. Supply the actual preview origin in `SITE_URL`. Changing it or `SITE_INDEXABLE` requires rebuilding because metadata and headers are baked into the build. Production cutover, DNS changes and enabling indexing require a separate launch instruction.

## Venue enquiries

The same `/api/venue-enquiries` endpoint and form fields are retained. Requests are validated, bounded, checked for origin and honeypot spam, and written through parameterized queries. Duplicate submission IDs do not insert another row or overwrite the original. Success is returned only after the transaction commits. Diagnostic logs exclude submitted details.

Import [deploy/schema.mysql.sql](deploy/schema.mysql.sql) into the **new** database through phpMyAdmin. No SSH, migration URL or build-time database connection is required. See [docs/DATABASE-MIGRATION.md](docs/DATABASE-MIGRATION.md) for setup, retry checks and an offline D1 export conversion workflow. Original D1 records were not inspected or exported; their number and contents are unknown.

The form stores enquiries; email notifications were not configured in the source and have not been added. The existing email links remain available. Photo upload, payment and nail printing happen on the physical machine as described in the source; this website has no upload or payment backend.

## Verify

```sh
npm run test:runtime
```

The default suite tests the standalone HTTP server, assets, preview SEO directives, validation, missing database behavior, ports and offline conversion. To include real database checks, provide `DB_*` for a disposable local MySQL database whose name begins `jolly_test_`, set `JOLLY_TEST_DATABASE=1`, and run the suite. It creates/imports the schema and deletes test rows in that isolated database; never point it at production.

See [docs/VALIDATION.md](docs/VALIDATION.md) for observed results and deployment limitations. [docs/source-manifest.json](docs/source-manifest.json) records the original source hashes. Credentials, private exports, dependency directories and generated builds are excluded from delivery. Third-party component and stylesheet notices are retained.
