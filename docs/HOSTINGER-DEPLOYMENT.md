# Hostinger deployment — Jolly Nail Printing version 2

Prepared 3 October 2026 (Australia/Sydney). This is an independent preview migration. The original website, GitHub repository, database and DNS must remain unchanged.

## Exact build settings

In **Websites → Add Website → Node.js web app → Import Git repository**, select the new private repository using the owning account's Hostinger GitHub App connection. If the repository is missing, grant that existing app access to the new repository and refresh the list. Do not switch accounts or disconnect other installations.

Independent private repository: [senju4477/jolly-nail-printing-hostinger-v2](https://github.com/senju4477/jolly-nail-printing-hostinger-v2), branch `main`. The complete migration source has been uploaded. Hostinger deployment remains pending.

| Setting | Value for this project |
|---|---|
| Repository | `senju4477/jolly-nail-printing-hostinger-v2` (private) |
| Branch | `main` |
| Root directory | `/` or blank |
| Framework | Next.js, server mode (`next`) |
| Node.js | 22.x; choose the maintained patch available in hPanel |
| Package manager | npm |
| Build script selector | `build` |
| Full build-command field, if shown | `npm run build` |
| Output directory | `.next` |
| Entry file | Blank / ignored by the Next.js preset |
| Startup | Hostinger's Next.js preset starts the generated standalone server |

The script is `next build --webpack && node scripts/prepare-standalone.mjs`. The preparation script exists and has been run successfully. Do not replace `.next` with `.next/standalone` in hPanel, add a root custom Next server, or append Webpack flags to the chained npm command. The repository exports one supported configuration object in `next.config.mjs`.

Hostinger's GitHub Node.js workflow performs install, build and startup. The generic Git file-copy feature does not. A successful build must be followed by checking the actual app URL, runtime logs and static assets.

## Environment variables

Enter real values in the right-hand value fields; automatically detected variable names are not completed configuration. Use `.env.example` as a list, not as working credentials. Do not send passwords or tokens through chat or commit `.env.local`.

| Key | Required | Purpose / visibility | Stage | After changing |
|---|---|---|---|---|
| `SITE_URL` | Set for hosted preview; required before indexing | Actual preview HTTPS origin; later the approved production origin. Public, server-read. No path, query, credentials or fragment. | Build + runtime | Rebuild/redeploy |
| `SITE_INDEXABLE` | Set `false` for preview | Only exact `true` enables indexing. Missing/other values remain non-indexable. Public, server-read. | Build + runtime | Rebuild/redeploy |
| `HOSTNAME` | Set `0.0.0.0` | Listening address read by generated Next server. Public. The local launcher enforces this value. | Runtime | Restart/redeploy |
| `PORT` | Supplied by Hostinger | Assigned listening port. Omit a fixed row in hPanel. Local `npm start` defaults to 3000. | Runtime | Platform-managed |
| `DB_HOST` | Required for enquiries | Actual host from the new database's details; often `localhost`, never guessed. Private connection configuration. | Runtime only | Restart/redeploy |
| `DB_PORT` | Optional; defaults to 3306 | Actual MySQL TCP port. Private connection configuration. | Runtime only | Restart/redeploy |
| `DB_USER` | Required for enquiries | Full new database username, including the Hostinger prefix. Private. | Runtime only | Restart/redeploy |
| `DB_PASSWORD` | Required for enquiries | Actual new database password. Secret. | Runtime only | Restart/redeploy |
| `DB_NAME` | Required for enquiries | Full new database name, including its prefix. Private. | Runtime only | Restart/redeploy |
| `DB_SSL` | Optional | `true` requires verified TLS with system trust; defaults to `false`. Confirm the hosted database's connection requirements before use. Server-only. | Runtime only | Restart/redeploy |
| `DB_SSL_CA` | Optional when database TLS needs its own CA | Actual provider PEM CA certificate. Setting it also enables verified TLS. Do not disable certificate verification. Server-only. | Runtime only | Restart/redeploy |

The actual Hostinger database host, engine/version, TLS requirements and grants have not been observed. Check them in hPanel/phpMyAdmin before enabling enquiry storage. For a remote database, verify its TLS requirement and provide the relevant settings.

There is no `DATABASE_URL`, D1 `DB` binding, Wrangler variable or public credential key in this implementation. Remove obsolete provider rows and test-only `JOLLY_TEST_DATABASE` if source scanning detects them. Do not put credentials in `NEXT_PUBLIC_*` variables.

Hostinger injects environment variables at build and runtime. Save the values before the build. A pages-only preview can omit `DB_*`; forms will correctly report unavailable storage. If `SITE_URL` is omitted, non-indexable builds retain the original source canonical origin as a fallback. Replace it with the actual preview URL and rebuild before sharing a completed preview.

## Database setup without SSH

1. Create a **new** database and user in **Websites → Dashboard → Databases → Management**.
2. Open phpMyAdmin for that new database. Confirm the selected database name and note its engine/version and required connection settings.
3. Import `deploy/schema.mysql.sql`. This creates the enquiry table and a migration ledger. It does not access or alter the original database.
4. Confirm the ledger checksum and table definition using the checks in `docs/DATABASE-MIGRATION.md`.
5. Enter the actual `DB_*` values in the new Node.js app. Restart or redeploy using hPanel.
6. Submit a labelled test enquiry from the actual preview URL. Verify the reference and row in phpMyAdmin, then remove only that test row. Check the unavailable-database behavior in the preview app before accepting real enquiries.

No database command, migration URL, server terminal or SSH is needed by the deployed app or setup guide. Builds never create tables or connect to MySQL.

## Preview acceptance and production cutover

| Check | What to verify on Hostinger |
|---|---|
| Deployment | Correct new repository, `main`, expected commit and Node 22 patch |
| Build | Webpack compile and standalone preparation finish successfully |
| Runtime | Actual app URL responds; runtime logs show the generated server running |
| Assets | CSS, JS, both fonts, images and machine video load over HTTPS |
| UI | Mobile menu, gallery, dialogs, tabs, search, FAQs and enquiry form |
| Database | New MySQL schema and a real labelled write/read; duplicates do not add rows |
| Indexing | `SITE_INDEXABLE=false`, HTTP `X-Robots-Tag` and HTML robots noindex |
| Canonical | Actual configured preview origin; sitemap contains no indexable page URLs |

This preview is non-indexable, which is not password protection. Use the account's access controls if a private preview is required. No Hostinger preview URL has been claimed without an actual deployment.

Before a separately authorized production launch: confirm the production domain, export/back up the relevant databases, review any original D1 record migration, verify form storage and the absence/presence of email delivery, set the production `SITE_URL`, set `SITE_INDEXABLE=true`, rebuild, then verify canonical/robots/sitemap, HTTPS and DNS. Production cutover has not been performed.

## Rollback

Before cutover, continue using the unchanged original website. The new preview can be stopped or redeployed independently. Restore code in the new repository/app from a known commit if necessary. A Git rollback does not recover MySQL rows: export the new database in phpMyAdmin before changes and restore it separately into a new database if required. Do not delete a database or reuse a live slot as a rollback shortcut.

## Official documentation checked

- [Hostinger Next.js preset](https://docs.hostinger.com/node.js/overview-1/next)
- [Hostinger build settings](https://docs.hostinger.com/node.js/build-settings)
- [Hostinger GitHub deployment](https://docs.hostinger.com/node.js/github)
- [Hostinger MySQL connection guide](https://www.hostinger.com/support/connecting-a-hostinger-mysql-database-to-a-node-js-application/)
- [Next.js standalone output](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Next.js 16 Webpack option](https://nextjs.org/docs/app/guides/upgrading/version-16)
