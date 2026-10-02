# Jolly Nail Printing

A premium, responsive website for an Australian self-service nail art printing business.

Live website: https://jolly-nail-printing-studio.walkersaint402.chatgpt.site

## Included

- Cobalt, porcelain and cherry-red visual identity with original nail imagery.
- Responsive navigation, design gallery filters, machine details and video dialogs.
- Four-step customer experience and accessible FAQ accordions.
- Location search with an honest coming-soon state.
- Venue enquiry form with server validation and durable Cloudflare D1 storage.
- Local fonts, images, machine footage and reduced-motion support.

## Technology

React, TypeScript, Vinext with Vite, Tailwind CSS, Radix UI, Cloudflare Workers and Cloudflare D1. The production website currently uses Sites hosting. This repository preserves the website source and assets; it is not a static GitHub Pages export.

## Local development

Requires Node.js 22.13 or newer and pnpm 11.25.0, as declared in package.json.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The portable development server starts on port 5173. To build and preview the production Worker:

```sh
pnpm build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_large_randall_flagg.sql
pnpm start
```

Apply the migration once per fresh local database. Local Wrangler data is ignored by Git. Production needs the Cloudflare D1 binding named DB and the included migration; production binding identifiers and secrets are managed by the hosting platform.

## Editing

- Homepage: app/page.tsx
- Visual styles: app/globals.css
- Metadata: app/layout.tsx
- Future confirmed machines: lib/locations.ts
- Enquiry endpoint: app/api/venue-enquiries/route.ts
- Enquiry schema and migration: db/schema.ts and drizzle/
- Images, local fonts and videos: public/

Launch locations are intentionally unconfirmed. Gallery images are design inspiration, not customer results. Enquiries are saved to the database; email notifications are not configured.

Additional runtime and deployment notes: [docs/development.md](docs/development.md).

Keep credentials, environment files, local database contents and build output out of Git. Existing third-party license notices are included with their respective files.
