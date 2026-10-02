# Verification and delivery status

Verified locally on 3 October 2026 (Australia/Sydney). Local testing is not Hostinger verification.

## Source and preservation

Source: `https://github.com/senju4477/jolly-nail-printing`, `main`, commit `ca269047f6367ae4389f84077a303c4e55f6bbb7`. The source checkout has no changes. Its full file hashes are recorded in `docs/source-manifest.json`.

The homepage, stylesheet, location definitions and all nine public assets were compared byte-for-byte with the original. The wordmark, original copy, navigation anchors, illustrations/images, local fonts, gallery, machine video, FAQs, contact details and responsive styles are preserved.

The original implementation had one page (`/`) and one active backend endpoint (`POST /api/venue-enquiries`). The migration retains both and adds preview-aware `/robots.txt` and `/sitemap.xml`. No real customer records, authentication service, email provider, payment API or file-upload backend was inspected or changed.

## Observed checks

| Check | Result |
|---|---|
| Node.js | 22.23.3 tested locally; actual Hostinger patch not observed |
| npm | 11.9.0 tested with committed lockfile |
| Clean installation | `npm ci` passed |
| Production build | Next.js 16.3.8 Webpack build passed; no database credentials needed |
| Standalone packaging | Generated server exists; public and Next static assets copied successfully |
| TypeScript | Build type checks and `npm run typecheck` passed |
| Lint | Passed with zero errors and four retained source `<img>` warnings |
| Dependency audit | Final `npm audit` reported zero vulnerabilities |
| HTTP runtime | All seven test groups passed, with zero skips in the MySQL run |
| Pages / methods | Homepage 200, unknown page 404, enquiry GET 405 |
| Static assets | All public files served with matching SHA-256 hashes; compiled CSS and JS served |
| Startup | Default 3000 and a dynamically selected custom port verified; launcher binds `0.0.0.0` |
| Preview indexing | HTML noindex, HTTP `X-Robots-Tag`, disallow-all robots and no sitemap page entries verified |
| API validation | Malformed JSON, invalid email/ID/consent, honeypot, origin, content type and size limits verified |
| Missing / disconnected database | Valid enquiry returns 503 and no `saved:true`; no submitted details in diagnostic logs |
| Real database | Oracle MySQL 8.0.46-0ubuntu0.24.04.3 (Ubuntu build), InnoDB, tested locally; not MariaDB |
| Schema retry | Initial SQL imported twice; one ledger entry retained |
| Durable enquiry storage | Actual parameterized writes and reads, Unicode, quotes/newlines, consent and epoch timestamps verified |
| Duplicate submission | Same ID reused without another row or overwrite of committed details |
| Concurrent submissions | Eight requests sharing one ID plus ten distinct requests verified; expected final count confirmed |
| Persistence | Committed rows read after the application process exited |
| Offline record conversion | Identical duplicates handled, conflicting duplicates rejected, Unicode preserved |
| Actual staged SQL import | Converted SQL imported twice in MySQL; counts/conflicts verified; reviewed merge run twice without duplicate rows |
| Browser | Chromium 153.0.8010.0 |
| Responsive widths | 1440, 768, 390 and 375 px; no document-level horizontal overflow |
| Browser interactions | Mobile menu, gallery filter, all-designs toggle, design/video dialogs, machine tabs, location search, FAQ, form success and reset passed |
| Machine video | Metadata loaded; duration 21.033333 seconds, no media error |
| Browser form storage | Form submitted through the UI and its actual SQL row/reference verified; labelled test row removed |
| Browser errors | No page errors or failed asset responses during the completed UI check |

`docs/ui-validation.json` contains the browser check results. The test database was isolated and contained labelled synthetic data only.

## Warnings and limits

- Existing plain `<img>` elements produce four Next.js lint recommendations. They were preserved to avoid changing image behavior during a hosting migration.
- The retained ESLint 9.39.4 dependency reports a deprecation notice. Installation and lint still pass; no checks were disabled.
- The local environment reports npm proxy-configuration / experimental proxy-agent notices. These did not prevent installation, builds or HTTP checks; they are not evidence of a Hostinger failure.
- In the preserved desktop design, part of the small decorative text over the arched hero photo is clipped by the original photo mask. The homepage and CSS were intentionally kept unchanged for this migration. Mobile hero text and the main copy remain readable.
- Source D1 data counts and contents are unknown. No customer data export or production database migration was performed.
- The form saves to MySQL; email notifications are not configured, matching the source. Actual email delivery was not tested.
- Hostinger account capacity, app creation, assigned URL, selected patch, generated-wrapper startup, runtime logs, database engine/grants/TLS and hosted enquiries have not been verified.
- Production domain, DNS, SSL cutover and indexing have not been changed or verified.

## Deployment status

| Stage | Status |
|---|---|
| Implemented | Complete in the independent project |
| Uploaded to new GitHub repository | Complete in private `senju4477/jolly-nail-printing-hostinger-v2`, branch `main`; original source history retained |
| Built on Hostinger | Not performed |
| Running on Hostinger | Not performed; no preview URL claimed |
| Database verified | Local Oracle MySQL verified; Hostinger database pending |
| Production domain verified | Not performed; production cutover not authorized |

The portable source package contains the complete project, assets, lockfile, build/start scripts, schema, migration workflow and guides. It excludes dependencies, generated build output, secrets, customer exports and local test databases.
